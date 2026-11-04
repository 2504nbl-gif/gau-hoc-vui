// Hiệu ứng âm thanh tự sinh bằng Web Audio API (Oscillator + nhiễu), không cần file mp3.
import type { NoteName } from '@/types/curriculum';
import { audioCtx, sfxOut } from './AudioManager';

/** Tần số chuẩn (A4 = 440 Hz, bình quân 12 cung). Đô Rê Mi Pha Son La Si Đô. */
export const NOTE_HZ: Record<NoteName, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25,
};
export const NOTE_LABEL: Record<NoteName, string> = {
  C4: 'Đô', D4: 'Rê', E4: 'Mi', F4: 'Pha', G4: 'Son', A4: 'La', B4: 'Si', C5: 'Đố',
};

function env(g: GainNode, t: number, peak: number, attack: number, dur: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

/** Một nốt đơn có đường bao âm lượng; `glide` = tần số trượt tới (Hz); `dest` = kênh ra (mặc định kênh hiệu ứng). */
export function tone(freq: number, dur = 0.25, type: OscillatorType = 'triangle', vol = 0.2, delay = 0, glide?: number, dest?: AudioNode | null) {
  const c = audioCtx();
  const out = dest ?? sfxOut();
  if (!c || !out) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur * 0.8);
  env(g, t, vol, 0.008, dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export function noise(dur: number, delay: number, filter: BiquadFilterType, from: number, to: number, vol: number) {
  const c = audioCtx();
  const out = sfxOut();
  if (!c || !out) return;
  const t = c.currentTime + delay;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  const f = c.createBiquadFilter();
  const g = c.createGain();
  src.buffer = buf;
  f.type = filter;
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  env(g, t, vol, 0.01, dur);
  src.connect(f).connect(g).connect(out);
  src.start(t);
}

export const sfx = {
  /** Chạm nút */
  tap: () => tone(660, 0.07, 'sine', 0.12),
  /** Chọn một mục */
  select: () => { tone(660, 0.1, 'triangle', 0.15); tone(990, 0.12, 'triangle', 0.13, 0.06); },
  /** "Ting!" khi bé chọn đúng: tiếng chuông 2 lớp, sáng và vui */
  correct: () => {
    tone(1318.5, 0.5, 'sine', 0.22);          // E6
    tone(2637, 0.35, 'sine', 0.06);           // bồi âm cho giống chuông
    tone(1760, 0.6, 'sine', 0.16, 0.09);      // A6
  },
  /** "Èo…" nhẹ nhàng khi chọn sai: trượt xuống, không chói */
  wrong: () => { tone(420, 0.32, 'sine', 0.16, 0, 240); tone(300, 0.3, 'triangle', 0.08, 0.12, 190); },
  /** "Bụp" mềm */
  pop: () => tone(240, 0.12, 'sine', 0.2, 0, 90),
  /** "Xoẹt" lật thẻ: nhiễu lọc quét từ cao xuống */
  flip: () => noise(0.16, 0, 'bandpass', 4200, 900, 0.09),
  /** Hoàn thành: hợp âm rải Đô–Mi–Son–Đố */
  success: () => (['C5', 'E4', 'G4', 'C5'] as const).forEach((n, i) => tone(NOTE_HZ[n] * (i === 0 ? 1 : 2), 0.35, 'triangle', 0.18, i * 0.11)),
  /** Vỗ tay: nhiều tiếng bốp ngắn ngẫu nhiên */
  applause: (seconds = 1.6) => {
    for (let i = 0; i < seconds * 24; i++) noise(0.05, Math.random() * seconds, 'bandpass', 1500 + Math.random() * 1200, 1200, 0.25);
  },
  /** Một nốt nhạc kiểu đàn xylophone */
  note: (n: NoteName, dur = 0.9) => { tone(NOTE_HZ[n], dur, 'triangle', 0.3); tone(NOTE_HZ[n] * 4, 0.12, 'sine', 0.05); },
};
