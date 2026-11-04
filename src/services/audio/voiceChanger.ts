// Gấu nhại giọng: nghe micro, tự phát hiện bé nói (RMS + tự hiệu chỉnh tiếng ồn nền),
// thu tới khi bé im ~0,8 giây (tối đa 6 giây) rồi phát lại giọng cao, vui.
// Bản thu CHỈ nằm trong bộ nhớ (Float32Array), phát xong là bỏ — không lưu ở đâu cả.
import { audioCtx, playSegment, type Segment } from './AudioManager';
import { isSpeaking } from './voice';

/** off = tạm dừng nghe · listening = chờ bé nói · hearing = đang thu · speaking = gấu đang nói lại. */
export type VoiceState = 'off' | 'listening' | 'hearing' | 'speaking';

export interface VoiceChanger {
  /** Bật/tắt nghe (vd lúc gấu ngủ, đang nhảy). Tắt giữa chừng thì bỏ đoạn đang thu. */
  setPaused: (p: boolean) => void;
  /** Bỏ qua micro trong `ms` mili-giây (gấu vừa phát hiệu ứng, tránh tự nghe chính mình). */
  hold: (ms: number) => void;
  /** Độ to âm thanh gấu đang phát lại, 0–1 (để mấp máy miệng). */
  level: () => number;
  close: () => void;
}

export type OpenResult = VoiceChanger | 'denied' | 'unsupported';

/** Cao độ phát lại: 1,55 = giọng cao, nhanh, vui. */
const RATE = 1.55;
const CHUNK = 2048;
/** Im lặng bao lâu thì coi như bé nói xong (giây). */
const END_SILENCE = 0.8;
const MAX_REC = 6;
/** Ngắn hơn thế này là tiếng động (ho, gõ bàn), bỏ qua. */
const MIN_VOICE = 0.3;
/** Giữ lại ~0,25 giây trước lúc phát hiện để không mất đầu câu. */
const PRE_ROLL = 6;
/** Ngưỡng tối thiểu và hệ số so với tiếng ồn nền. */
const MIN_THRESHOLD = 0.012;
const FLOOR_FACTOR = 3;

const rms = (d: Float32Array) => {
  let s = 0;
  for (let i = 0; i < d.length; i++) s += d[i] * d[i];
  return Math.sqrt(s / d.length);
};

/** Mở micro. Bị từ chối → 'denied'; máy không có micro / trình duyệt không cho → 'unsupported'. */
export async function openVoiceChanger(onState: (s: VoiceState) => void): Promise<OpenResult> {
  const c = audioCtx();
  if (!c || !navigator.mediaDevices?.getUserMedia || !('createScriptProcessor' in c)) return 'unsupported';
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (e) {
    const name = (e as DOMException)?.name;
    return name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unsupported';
  }
  if (c.state === 'suspended') void c.resume();

  const src = c.createMediaStreamSource(stream);
  // ScriptProcessor: cũ nhưng chạy ở mọi trình duyệt (kể cả Android cũ), không cần file worklet riêng.
  const proc = c.createScriptProcessor(CHUNK, 1, 1);
  const sink = c.createGain();
  sink.gain.value = 0; // phải nối ra loa thì processor mới chạy; để câm.
  src.connect(proc);
  proc.connect(sink);
  sink.connect(c.destination);
  const analyser = c.createAnalyser();
  analyser.fftSize = 512;
  const levelBuf = new Float32Array(analyser.fftSize);

  let state: VoiceState = 'listening';
  let paused = false;
  let holdUntil = 0;
  let floor = 0.01;
  let warmup = 10;          // ~0,4 giây đầu chỉ đo tiếng ồn nền
  let above = 0;
  let pre: Float32Array[] = [];
  let rec: Float32Array[] = [];
  let recS = 0;
  let silentS = 0;
  let seg: Segment | null = null;
  const chunkS = CHUNK / c.sampleRate;

  const set = (s: VoiceState) => { if (s !== state) { state = s; onState(s); } };
  const reset = () => { above = 0; pre = []; rec = []; recS = 0; silentS = 0; };

  function playBack(chunks: Float32Array[], keep: number) {
    const n = Math.min(keep, chunks.length * CHUNK);
    const buf = c!.createBuffer(1, n, c!.sampleRate);
    const out = buf.getChannelData(0);
    let peak = 0;
    for (let i = 0, o = 0; i < chunks.length && o < n; i++) {
      const part = chunks[i].subarray(0, n - o);
      out.set(part, o);
      o += part.length;
    }
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
    // Bé nói nhỏ thì khuếch đại lên (tối đa 6 lần), đều tiếng.
    const gain = peak > 0 ? Math.min(6, 0.9 / peak) : 1;
    for (let i = 0; i < n; i++) out[i] *= gain;
    // Vuốt nhẹ 2 đầu cho khỏi "bụp".
    const fade = Math.min(n >> 1, Math.round(c!.sampleRate * 0.02));
    for (let i = 0; i < fade; i++) { const k = i / fade; out[i] *= k; out[n - 1 - i] *= k; }

    set('speaking');
    seg = playSegment(buf, 0, buf.duration, { rate: RATE, tap: analyser });
    void seg.ended.then(() => {
      seg = null;
      holdUntil = performance.now() + 400; // tiếng vọng trong phòng tắt hẳn rồi mới nghe tiếp
      reset();
      set(paused ? 'off' : 'listening');
    });
  }

  proc.onaudioprocess = (ev) => {
    if (state === 'speaking') return;
    if (paused || performance.now() < holdUntil || isSpeaking()) {
      if (state === 'hearing') set(paused ? 'off' : 'listening');
      reset();
      return;
    }
    const data = new Float32Array(ev.inputBuffer.getChannelData(0));
    const v = rms(data);
    const threshold = Math.max(MIN_THRESHOLD, floor * FLOOR_FACTOR);

    if (state !== 'hearing') {
      // Tự hiệu chỉnh: tiếng ồn nền là mức trung bình chậm của những đoạn không có tiếng nói.
      if (v < threshold || warmup > 0) floor = floor * 0.92 + v * 0.08;
      if (warmup > 0) { warmup--; return; }
      pre.push(data);
      if (pre.length > PRE_ROLL) pre.shift();
      above = v > threshold ? above + 1 : 0;
      if (above >= 2) { rec = pre; pre = []; recS = rec.length * chunkS; silentS = 0; set('hearing'); }
      return;
    }

    rec.push(data);
    recS += chunkS;
    silentS = v < threshold * 0.75 ? silentS + chunkS : 0;
    if (silentS < END_SILENCE && recS < MAX_REC) return;

    const voiced = recS - silentS - PRE_ROLL * chunkS;
    // Giữ 0,15 giây im lặng ở cuối cho tự nhiên.
    const keep = Math.round((recS - Math.max(0, silentS - 0.15)) * c.sampleRate);
    const chunks = rec;
    reset();
    if (voiced < MIN_VOICE || keep <= 0) { set('listening'); return; }
    playBack(chunks, keep);
  };

  return {
    setPaused: (p) => {
      paused = p;
      if (state === 'speaking') return; // nói nốt rồi tự chuyển trạng thái
      reset();
      set(p ? 'off' : 'listening');
    },
    hold: (ms) => { holdUntil = Math.max(holdUntil, performance.now() + ms); },
    level: () => {
      if (!seg) return 0;
      analyser.getFloatTimeDomainData(levelBuf);
      return Math.min(1, rms(levelBuf) * 5);
    },
    close: () => {
      proc.onaudioprocess = null;
      seg?.stop();
      try { src.disconnect(); proc.disconnect(); sink.disconnect(); analyser.disconnect(); } catch { /* đã ngắt */ }
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}
