// Một AudioContext dùng chung cho giọng đọc và hiệu ứng.
// Âm thanh được giải mã sẵn vào bộ nhớ (AudioBuffer) nên phát ngay, không trễ,
// và dừng được tức thì khi thẻ chuyển sớm.

let ctx: AudioContext | null = null;
let voiceBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let voiceVol = 1;
/** Số đoạn giọng đang phát qua Web Audio (để nhạc nền tự hạ khi cô đang đọc). */
let voicePlaying = 0;

export function audioCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new C();
    voiceBus = ctx.createGain();
    voiceBus.gain.value = voiceVol;
    voiceBus.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.9;
    sfxBus.connect(ctx.destination);
  } catch {
    ctx = null;
  }
  return ctx;
}

export const sfxOut = () => (audioCtx(), sfxBus);
export const musicOut = () => (audioCtx(), musicBus);

/** Âm lượng giọng đọc 0–1 (gói giọng qua Web Audio; giọng máy đọc giá trị này qua voiceVolume()). */
export function setVoiceVolume(v: number) {
  voiceVol = v;
  if (voiceBus) voiceBus.gain.value = v;
}
export const voiceVolume = () => voiceVol;
export const voiceSegmentsPlaying = () => voicePlaying > 0;

/** Trình duyệt chỉ cho phát tiếng sau lần chạm đầu tiên. Gọi trong sự kiện chạm. */
export function unlockAudio() {
  const c = audioCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  // iOS cần phát một âm im lặng trong chính lần chạm đó.
  const b = c.createBuffer(1, 1, 22050);
  const s = c.createBufferSource();
  s.buffer = b;
  s.connect(c.destination);
  s.start(0);
}

const buffers = new Map<string, Promise<AudioBuffer>>();
const ready = new Set<string>();

/** Tải và giải mã 1 file âm thanh (nhớ lại cho lần sau). */
export function loadBuffer(url: string): Promise<AudioBuffer> {
  let p = buffers.get(url);
  if (!p) {
    const c = audioCtx();
    p = fetch(url)
      .then((r) => { if (!r.ok) throw new Error(`${r.status} ${url}`); return r.arrayBuffer(); })
      .then((ab) => {
        if (!c) throw new Error('Máy không hỗ trợ Web Audio');
        return new Promise<AudioBuffer>((res, rej) => c.decodeAudioData(ab, res, rej));
      })
      .then((buf) => { ready.add(url); return buf; });
    p.catch(() => buffers.delete(url)); // lỗi mạng thì lần sau thử lại
    buffers.set(url, p);
  }
  return p;
}

export const isLoaded = (url: string) => ready.has(url);

export interface Segment {
  /** Thời điểm (giây, theo đồng hồ AudioContext) bắt đầu phát. */
  startedAt: number;
  stop: () => void;
  ended: Promise<void>;
}

/**
 * Phát một đoạn [offset, offset+duration] của buffer qua kênh giọng đọc.
 * `rate` = tốc độ/cao độ phát (Gấu nhại giọng dùng ~1.5); `tap` = nút nghe trộm tín hiệu (vd AnalyserNode để mấp máy miệng).
 */
export function playSegment(buf: AudioBuffer, offset: number, duration: number, opts: { rate?: number; tap?: AudioNode } = {}): Segment {
  const c = audioCtx()!;
  const src = c.createBufferSource();
  src.buffer = buf;
  if (opts.rate) src.playbackRate.value = opts.rate;
  src.connect(voiceBus!);
  if (opts.tap) src.connect(opts.tap);
  const startedAt = c.currentTime;
  src.start(startedAt, offset, duration);
  voicePlaying++;
  let settled = false;
  let resolve!: () => void;
  const ended = new Promise<void>((r) => (resolve = () => { if (!settled) { settled = true; voicePlaying--; } r(); }));
  src.onended = () => resolve();
  return {
    startedAt,
    ended,
    stop: () => { try { src.stop(); } catch { /* đã dừng */ } resolve(); },
  };
}
