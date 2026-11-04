"""
Tạo gói giọng đọc cho Gấu Học Vui.

Hai bộ máy đọc (chọn bằng --engine):
  • omnivoice  — OmniVoice (k2-fsa, Apache-2.0): giọng tự nhiên, cần card đồ họa (Colab T4, GTX 1660…).
  • piper      — Piper: chạy trên CPU, nhẹ, giọng máy hơn. Dùng làm dự phòng.

Đầu vào : scripts/voice-texts.json  (tạo bằng: npm run voice:texts)
Đầu ra  : public/audio/<nhóm>.mp3 + public/audio/manifest.json   (gói giọng bố, bố cục cũ)
          hoặc public/audio/<pack>/…  khi dùng --pack bo|me  (nhiều gói, app chọn trong Góc phụ huynh)

Mỗi nhóm (1 chủ đề / 1 bài thơ) gộp thành 1 file mp3 ("sprite"); manifest ghi câu nào nằm ở giây
thứ mấy. Thơ/truyện có thêm mốc thời gian từng chữ để chạy karaoke. App không cần sửa gì khi đổi giọng.

Ví dụ:
  # OmniVoice, sao chép giọng từ một đoạn ghi âm 5–10 giây (khuyên dùng)
  python scripts/build_voice_pack.py --engine omnivoice --ref-audio me.wav --ref-text "Chào con yêu! ..."
  # OmniVoice, tự thiết kế giọng cô giáo (không cần ghi âm)
  python scripts/build_voice_pack.py --engine omnivoice --instruct "female, young adult, high pitch"
  # Piper
  python scripts/build_voice_pack.py --engine piper --model vi_VN-vais1000-medium.onnx
  # Gói giọng mẹ (thư mục riêng public/audio/me/, bộ đệm riêng .voice-cache/me/)
  python scripts/build_voice_pack.py --pack me --ref-audio me.wav --ref-text "…"
Cần ffmpeg trong PATH để nén mp3.
"""
import argparse, hashlib, json, re, subprocess, sys, tempfile, time, unicodedata, wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
PRE_PAD, POST_PAD, GAP = 0.06, 0.06, 0.25   # giây
PUNCT_PAUSE = 0.18                            # trọng số nghỉ sau dấu câu khi chia thời gian chữ

# Câu dùng để tạo giọng mẫu khi thiết kế giọng (không có ghi âm).
SEED_TEXT = "Chào con yêu! Hôm nay cô cùng con đọc thơ, đếm số và tìm các bạn con vật nhé. Con sẵn sàng chưa nào?"


def norm(t: str) -> str:
    """Phải khớp normKey() trong src/services/audio/voicePack.ts"""
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", t).strip())


def trim_silence(a: np.ndarray, sr: int) -> np.ndarray:
    if a.size == 0:
        return a
    win = max(1, int(sr * 0.01))
    env = np.sqrt(np.convolve(a.astype(np.float32) ** 2, np.ones(win) / win, mode="same"))
    idx = np.where(env > max(250.0, env.max() * 0.04))[0]
    return a[idx[0]: idx[-1] + 1] if idx.size else a


# ─────────────────────────── Bộ máy đọc ───────────────────────────

class PiperEngine:
    name = "piper"

    def __init__(self, a):
        from piper import PiperVoice
        self.v = PiperVoice.load(a.model)
        self.sr = self.v.config.sample_rate
        self.voice_id = Path(a.model).stem
        self.scale = {"card": a.length_scale, "story": a.story_length_scale}
        self.cache: dict = {}

    def synth(self, texts: list[str], kind: str) -> list[np.ndarray]:
        from piper import SynthesisConfig
        out = []
        for t in texts:
            key = (t, kind)
            if key not in self.cache:
                parts = [c.audio_int16_array for c in self.v.synthesize(t, SynthesisConfig(length_scale=self.scale[kind]))]
                self.cache[key] = np.concatenate(parts) if parts else np.zeros(0, np.int16)
            out.append(self.cache[key])
        return out

    def word_weight(self, word: str, kind: str) -> float:
        """Độ dài khi đọc riêng chữ đó — dùng để chia mốc karaoke."""
        clean = re.sub(r"[^\w]", "", word)
        return len(trim_silence(self.synth([clean], kind)[0], self.sr)) / self.sr if clean else 0.05


class OmniVoiceEngine:
    name = "omnivoice"

    def __init__(self, a, cache_dir: Path):
        import torch
        from omnivoice import OmniVoice
        dev = a.device or ("cuda:0" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
        dtype = torch.float16 if dev.startswith("cuda") else torch.float32
        print(f"Đang tải mô hình {a.omni_model} lên {dev}…")
        self.m = OmniVoice.from_pretrained(a.omni_model, device_map=dev, dtype=dtype)
        self.sr = int(getattr(self.m, "sampling_rate", 24000))
        self.lang = a.language
        self.steps = a.num_step
        self.batch = a.batch_size
        self.speed = {"card": a.speed, "story": a.story_speed}
        self.cache_dir = cache_dir
        self.prompt = self._voice_prompt(a)
        self.voice_id = f"omnivoice:{Path(a.ref_audio).stem if a.ref_audio else a.instruct}"

    def _voice_prompt(self, a):
        """Một giọng duy nhất cho cả app: sao chép từ ghi âm, hoặc thiết kế 1 lần rồi sao chép lại."""
        from omnivoice import VoiceClonePrompt
        saved = self.cache_dir / "voice_prompt.pt"
        if saved.exists() and not a.new_voice:
            print("Dùng lại giọng đã tạo lần trước:", saved)
            return VoiceClonePrompt.load(str(saved))
        if a.ref_audio:
            prompt = self.m.create_voice_clone_prompt(ref_audio=a.ref_audio, ref_text=a.ref_text or None)
        else:
            print(f'Thiết kế giọng: "{a.instruct}"')
            seed = self.m.generate(text=SEED_TEXT, language=self.lang, instruct=a.instruct, num_step=self.steps)[0]
            import soundfile as sf
            seed_wav = self.cache_dir / "voice_seed.wav"
            sf.write(seed_wav, seed, self.sr)
            print("Giọng mẫu (nghe thử trước khi chạy hết):", seed_wav)
            prompt = self.m.create_voice_clone_prompt(ref_audio=str(seed_wav), ref_text=SEED_TEXT)
        prompt.save(str(saved))
        return prompt

    def _key(self, text: str, kind: str) -> Path:
        h = hashlib.sha1(f"{text}|{kind}|{self.speed[kind]}|{self.steps}".encode()).hexdigest()[:16]
        return self.cache_dir / "clips" / f"{h}.npy"

    def synth(self, texts: list[str], kind: str) -> list[np.ndarray]:
        (self.cache_dir / "clips").mkdir(parents=True, exist_ok=True)
        todo = [t for t in dict.fromkeys(texts) if not self._key(t, kind).exists()]
        for i in range(0, len(todo), self.batch):
            chunk = todo[i: i + self.batch]
            audios = self.m.generate(text=chunk, language=[self.lang] * len(chunk), voice_clone_prompt=[self.prompt] * len(chunk),
                                     speed=self.speed[kind], num_step=self.steps)
            for t, au in zip(chunk, audios):
                pcm = np.clip(np.asarray(au, dtype=np.float32), -1, 1)
                np.save(self._key(t, kind), (pcm * 32767).astype(np.int16))
        return [np.load(self._key(t, kind)) for t in texts]

    def word_weight(self, word: str, kind: str) -> float:
        """Tiếng Việt mỗi chữ là một âm tiết: ước lượng theo số chữ cái thay vì đọc riêng (đỡ tốn GPU)."""
        clean = re.sub(r"[^\w]", "", word)
        return 0.16 + 0.035 * len(clean) if clean else 0.05


class StudioEngine:
    """Gọi OmniVoice Studio (github.com/debpalash/VoiceStudio) đang chạy trên máy: POST /generate trả về WAV.
    Dùng giọng đã lưu trong Studio (--profile-id), hoặc ghi âm (--ref-audio), hoặc mô tả giọng (--instruct + seed cố định)."""
    name = "studio"

    def __init__(self, a, cache_dir: Path):
        import requests
        self.http = requests.Session()
        self.url = a.studio_url.rstrip("/")
        if a.studio_key:
            self.http.headers["Authorization"] = f"Bearer {a.studio_key}"
        h = self.http.get(f"{self.url}/health", timeout=15)
        h.raise_for_status()
        print("Đã kết nối Studio:", h.json())
        self.a = a
        self.lang = a.language
        self.speed = {"card": a.speed, "story": a.story_speed}
        self.cache_dir = cache_dir
        self.sr = None
        tag = a.profile_id or (Path(a.ref_audio).stem if a.ref_audio else a.instruct)
        self.voice_id = f"studio:{tag}"

    def _key(self, text: str, kind: str) -> Path:
        tag = self.a.profile_id or self.a.ref_audio or self.a.instruct
        h = hashlib.sha1(f"studio|{tag}|{text}|{kind}|{self.speed[kind]}".encode()).hexdigest()[:16]
        return self.cache_dir / "clips" / f"{h}.npy"

    def _one(self, text: str, kind: str) -> np.ndarray:
        import io, soundfile as sf
        a = self.a
        form = {"text": text, "language": self.lang, "speed": str(self.speed[kind]), "num_step": str(a.num_step),
                "effect_preset": "broadcast", "wav_bits": "16"}
        files = None
        if a.profile_id:
            form["profile_id"] = a.profile_id
        elif a.ref_audio:
            form["ref_text"] = a.ref_text or ""
            files = {"ref_audio": (Path(a.ref_audio).name, open(a.ref_audio, "rb"))}
        else:
            form["instruct"] = a.instruct
            form["seed"] = str(a.seed)  # cùng seed → cùng một giọng cho mọi câu
        r = self.http.post(f"{self.url}/generate", data=form, files=files, timeout=1800)
        if r.status_code >= 400:
            raise SystemExit(f"Studio báo lỗi {r.status_code}: {r.text[:500]}")
        pcm, sr = sf.read(io.BytesIO(r.content), dtype="int16")
        if pcm.ndim > 1:
            pcm = pcm.mean(axis=1).astype(np.int16)
        if self.sr is None:
            self.sr = sr
        elif sr != self.sr:  # đổi tần số mẫu cho khớp các câu trước
            n = int(len(pcm) * self.sr / sr)
            pcm = np.interp(np.linspace(0, len(pcm) - 1, n), np.arange(len(pcm)), pcm).astype(np.int16)
        return pcm

    def synth(self, texts: list[str], kind: str) -> list[np.ndarray]:
        (self.cache_dir / "clips").mkdir(parents=True, exist_ok=True)
        for t in dict.fromkeys(texts):
            k = self._key(t, kind)
            if not k.exists():
                np.save(k, self._one(t, kind))
        if self.sr is None:  # mọi câu lấy từ bộ nhớ đệm
            self.sr = int((self.cache_dir / "sr.txt").read_text()) if (self.cache_dir / "sr.txt").exists() else 24000
        (self.cache_dir / "sr.txt").write_text(str(self.sr))
        return [np.load(self._key(t, kind)) for t in texts]

    def word_weight(self, word: str, kind: str) -> float:
        clean = re.sub(r"[^\w]", "", word)
        return 0.16 + 0.035 * len(clean) if clean else 0.05


# ─────────────────────────── Karaoke ───────────────────────────

def word_timings(eng, kind: str, text: str, clip: np.ndarray) -> list[list[float]]:
    """Mốc từng chữ: chia theo độ dài ước lượng của từng chữ, rồi bắt vào chỗ lặng gần nhất."""
    sr = eng.sr
    tokens = text.split(" ")
    durs = [eng.word_weight(tok, kind) for tok in tokens]
    pauses = [PUNCT_PAUSE if re.search(r"[,.:;!?]$", tok) else 0.0 for tok in tokens]
    L = len(clip) / sr
    total = sum(durs) + sum(pauses[:-1])
    k = L / total if total else 1
    win = max(1, int(sr * 0.01))
    env = np.sqrt(np.convolve(clip.astype(np.float32) ** 2, np.ones(win) / win, mode="same"))

    def snap(t: float, reach: float) -> float:
        a, b = int(max(0, t - reach) * sr), int(min(L, t + reach) * sr)
        return (a + int(np.argmin(env[a:b]))) / sr if b > a else t

    nominal, t = [], 0.0
    for i, d in enumerate(durs):
        nominal.append(t)
        t += (d + pauses[i]) * k
    starts = [0.0]
    for i in range(1, len(nominal)):
        reach = min(0.07, 0.3 * k * min(durs[i - 1], durs[i]))
        starts.append(max(snap(nominal[i], reach), starts[-1] + 0.6 * k * durs[i - 1]))
    return [[round(st + PRE_PAD, 3), round((starts[i + 1] if i + 1 < len(starts) else L) + PRE_PAD, 3)] for i, st in enumerate(starts)]


# ─────────────────────────── Chương trình chính ───────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", choices=["omnivoice", "studio", "piper"], default="omnivoice")
    ap.add_argument("--texts", default=str(ROOT / "scripts/voice-texts.json"))
    ap.add_argument("--pack", help="tên gói giọng (bo, me…): ghi vào public/audio/<pack>/ và dùng bộ đệm .voice-cache/<pack>/")
    ap.add_argument("--out", "--out-dir", dest="out", help="thư mục ra (mặc định public/audio, hoặc public/audio/<pack>)")
    ap.add_argument("--cache", help="thư mục lưu câu đã đọc để chạy tiếp khi bị ngắt (mặc định .voice-cache[/<pack>])")
    ap.add_argument("--bitrate", default="48k")
    ap.add_argument("--only", help="chỉ làm các nhóm có id chứa chuỗi này (vd: story-tho-yeu-me) để nghe thử")
    # OmniVoice
    ap.add_argument("--omni-model", default="k2-fsa/OmniVoice")
    ap.add_argument("--ref-audio", help="ghi âm giọng mẫu 5–10 giây (.wav/.mp3/.m4a)")
    ap.add_argument("--ref-text", help="lời đọc đúng trong ghi âm (bỏ trống thì cần Whisper tự nghe)")
    ap.add_argument("--instruct", default="female, young adult, high pitch", help="mô tả giọng khi không có ghi âm")
    ap.add_argument("--new-voice", action="store_true", help="tạo giọng mới, bỏ giọng đã lưu")
    ap.add_argument("--language", default="Vietnamese")
    ap.add_argument("--speed", type=float, default=0.85, help="tốc độ đọc thẻ, <1 là chậm hơn")
    ap.add_argument("--story-speed", type=float, default=0.8, help="tốc độ đọc thơ/truyện")
    ap.add_argument("--num-step", type=int, default=32)
    ap.add_argument("--batch-size", type=int, default=8)
    ap.add_argument("--device")
    # OmniVoice Studio
    ap.add_argument("--studio-url", default="http://127.0.0.1:3900")
    ap.add_argument("--studio-key", help="OMNIVOICE_API_KEY nếu Studio chạy ở máy khác")
    ap.add_argument("--profile-id", help="id giọng đã lưu trong Studio (xem: GET /profiles)")
    ap.add_argument("--seed", type=int, default=42)
    # Piper
    ap.add_argument("--model", help="file .onnx của Piper")
    ap.add_argument("--length-scale", type=float, default=1.5)
    ap.add_argument("--story-length-scale", type=float, default=1.8)
    ap.add_argument("--tempo", type=float, help="kéo giãn thêm (giữ cao độ), <1 là chậm hơn. Mặc định: piper 0.8, omnivoice 1.0")
    ap.add_argument("--story-tempo", type=float)
    a = ap.parse_args()

    a.out = a.out or str(ROOT / "public/audio" / (a.pack or ""))
    # Mỗi giọng một bộ đệm: OmniVoice lưu giọng mẫu (voice_prompt.pt) và câu đã đọc trong đây.
    a.cache = a.cache or str(ROOT / ".voice-cache" / (a.pack or ""))
    cache = Path(a.cache); cache.mkdir(parents=True, exist_ok=True)
    if a.engine == "piper":
        if not a.model:
            sys.exit("Piper cần --model đường/dẫn/vi_VN-vais1000-medium.onnx")
        eng = PiperEngine(a)
        tempo = {"card": a.tempo or 0.8, "story": a.story_tempo or 0.78}
    else:
        eng = StudioEngine(a, cache) if a.engine == "studio" else OmniVoiceEngine(a, cache)
        tempo = {"card": a.tempo or 1.0, "story": a.story_tempo or 1.0}

    jobs = json.loads(Path(a.texts).read_text(encoding="utf8"))
    if a.only:
        jobs = [j for j in jobs if a.only in j["id"]]
    out = Path(a.out).resolve(); out.mkdir(parents=True, exist_ok=True)
    # Đường dẫn sprite trong manifest tính từ gốc web (public/), vd "audio/me/x.mp3";
    # thư mục ngoài public/ thì ghi tên trần, app tự tính theo thư mục chứa manifest.
    try:
        web_dir = out.relative_to((ROOT / "public").resolve()).as_posix() + "/"
    except ValueError:
        web_dir = ""

    mpath = out / "manifest.json"
    # Khi chỉ làm một phần (--only) thì giữ các nhóm cũ trong manifest.
    old = json.loads(mpath.read_text(encoding="utf8")) if a.only and mpath.exists() else None
    manifest = {"voice": eng.voice_id, "generated": time.strftime("%Y-%m-%d"),
                "sprites": dict(old["sprites"]) if old else {}, "clips": dict(old["clips"]) if old else {}}
    total = sum(len(j["texts"]) for j in jobs)
    done_n, t0 = 0, time.time()

    for job in jobs:
        kind = "story" if job.get("words") else "card"
        tp = tempo[kind]
        clips = eng.synth(job["texts"], kind)
        sr = eng.sr  # Studio chỉ biết tần số mẫu sau câu đầu tiên
        pad = lambda sec: np.zeros(int(sec * sr), np.int16)
        pieces, pos, keys = [], 0, []
        for text, raw in zip(job["texts"], clips):
            clip = trim_silence(raw, sr)
            if clip.size == 0:
                print(f"  ! bỏ qua (không đọc được): {text}", file=sys.stderr); continue
            seg = np.concatenate([pad(PRE_PAD), clip, pad(POST_PAD)])
            entry = [job["id"], round(pos / sr, 3), round(len(seg) / sr, 3)]
            if job.get("words"):
                entry.append(word_timings(eng, kind, text, clip))
            manifest["clips"][norm(text)] = entry
            keys.append(norm(text))
            pieces += [seg, pad(GAP)]
            pos += len(seg) + int(GAP * sr)
        if not pieces:
            continue
        audio = np.concatenate(pieces)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            with wave.open(tmp.name, "wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(audio.tobytes())
            af = ["-af", f"atempo={tp}"] if abs(tp - 1) > 1e-3 else []
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name, *af, "-ac", "1", "-b:a", a.bitrate, str(out / f"{job['id']}.mp3")], check=True)
        k = 1 / tp  # atempo giãn thời gian đều tay → mọi mốc nhân cùng một hệ số
        for key in keys:
            e = manifest["clips"][key]
            e[1], e[2] = round(e[1] * k, 3), round(e[2] * k, 3)
            if len(e) > 3:
                e[3] = [[round(x * k, 3), round(y * k, 3)] for x, y in e[3]]
        manifest["sprites"][job["id"]] = f"{web_dir}{job['id']}.mp3"
        done_n += len(job["texts"])
        el = time.time() - t0
        print(f"✓ {job['id']}: {len(job['texts'])} câu, {len(audio) / sr / tp:.1f}s  [{done_n}/{total}, còn ~{el / done_n * (total - done_n) / 60:.0f} phút]", flush=True)

    mpath.write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
    print(f"Xong: {len(manifest['clips'])} câu, {len(manifest['sprites'])} file → {out}")


if __name__ == "__main__":
    main()
