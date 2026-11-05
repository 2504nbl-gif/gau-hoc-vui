// Mở micro dùng chung (Gấu biết nói, Tập thổi): xin quyền, nối vào AudioContext chung, phân loại lỗi.
import { audioCtx } from './AudioManager';

export type MicError = 'denied' | 'unsupported';

export interface Mic {
  ctx: AudioContext;
  stream: MediaStream;
  src: MediaStreamAudioSourceNode;
  /** Tắt micro (đèn micro trên máy tắt hẳn). */
  stop: () => void;
}

/** Độ to trung bình (RMS) của một đoạn mẫu. */
export const rms = (d: Float32Array) => {
  let s = 0;
  for (let i = 0; i < d.length; i++) s += d[i] * d[i];
  return Math.sqrt(s / d.length);
};

/**
 * Xin micro. Bị từ chối → 'denied'; máy không có micro / trình duyệt không cho (http, máy cũ) → 'unsupported'.
 * `clean` = bật lọc ồn/tự chỉnh âm lượng của máy (hợp với giọng nói; tiếng thổi thì phải tắt, vì bộ lọc coi nó là ồn).
 */
export async function openMic(clean: boolean): Promise<Mic | MicError> {
  const ctx = audioCtx();
  if (!ctx || !navigator.mediaDevices?.getUserMedia) return 'unsupported';
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: clean, autoGainControl: clean },
    });
  } catch (e) {
    const name = (e as DOMException)?.name;
    return name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unsupported';
  }
  if (ctx.state === 'suspended') void ctx.resume();
  const src = ctx.createMediaStreamSource(stream);
  return {
    ctx, stream, src,
    stop: () => {
      try { src.disconnect(); } catch { /* đã ngắt */ }
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}
