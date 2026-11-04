// Tiếng của Gấu biết nói — tự sinh bằng Web Audio (tone/noise), không cần file.
import { NOTE_HZ, noise, tone } from '@/services/audio/sfx';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export const bearSfx = {
  /** Cười khúc khích "hí hí hí": các tiếng ngắn đi xuống, hơi rung. */
  giggle: () => {
    for (let i = 0; i < 6; i++) {
      const f = 900 - i * 45 + rnd(-30, 30);
      tone(f, 0.09, 'sine', 0.2, i * 0.13, f * 1.25);
      tone(f * 2, 0.06, 'triangle', 0.04, i * 0.13);
    }
  },
  /** Gừ gừ sung sướng + "ting" nhỏ. */
  purr: () => {
    for (let i = 0; i < 7; i++) tone(118, 0.13, 'triangle', 0.14, i * 0.15, 98);
    tone(NOTE_HZ.E4 * 4, 0.4, 'sine', 0.05, 0.2);
    tone(NOTE_HZ.G4 * 4, 0.4, 'sine', 0.05, 0.4);
  },
  /** Giật mình "boing!" */
  boing: () => { tone(200, 0.4, 'sine', 0.28, 0, 900); tone(900, 0.25, 'triangle', 0.08, 0.32, 420); },
  /** "Á… á… hắt xì!" */
  sneeze: () => {
    tone(330, 0.3, 'sine', 0.13, 0, 430);
    tone(390, 0.3, 'sine', 0.15, 0.4, 520);
    noise(0.35, 0.78, 'highpass', 3600, 1600, 0.4);
    tone(520, 0.14, 'triangle', 0.12, 0.78, 240);
  },
  /** Nhai "măm măm". */
  munch: () => {
    for (let i = 0; i < 4; i++) {
      noise(0.09, i * 0.22, 'lowpass', 1100, 300, 0.45);
      tone(170, 0.09, 'sine', 0.16, i * 0.22, 120);
    }
  },
  /** Uống "ực ực". */
  gulp: () => { for (let i = 0; i < 3; i++) tone(170, 0.13, 'sine', 0.28, i * 0.32, 430); },
  /** Bong bóng xà phòng lách tách. */
  bubbles: () => { for (let i = 0; i < 5; i++) { const f = rnd(500, 900); tone(f, 0.08, 'sine', 0.13, i * 0.09 + rnd(0, 0.04), f * 2.2); } },
  /** Vòi sen "xèèè". */
  shower: () => noise(1.1, 0, 'highpass', 5200, 2600, 0.14),
  /** Ngáp. */
  yawn: () => { tone(420, 1.0, 'sine', 0.13, 0, 210); tone(840, 0.6, 'sine', 0.03, 0, 420); },
  /** Thức dậy: rải nốt đi lên. */
  wake: () => (['C4', 'E4', 'G4', 'C5'] as const).forEach((n, i) => tone(NOTE_HZ[n] * 2, 0.3, 'triangle', 0.15, i * 0.1)),
  /** Lấp lánh (tắm xong thơm phức). */
  sparkle: () => (['G4', 'C5', 'E4', 'G4'] as const).forEach((n, i) => tone(NOTE_HZ[n] * (i < 2 ? 2 : 4), 0.35, 'sine', 0.12, i * 0.08)),
};

const C4 = NOTE_HZ.C4, D4 = NOTE_HZ.D4, E4 = NOTE_HZ.E4, G4 = NOTE_HZ.G4, A4 = NOTE_HZ.A4;
/** Nhạc ru hộp nhạc: [tần số, số phách]. */
const LULLABY: [number, number][] = [
  [G4, 1], [E4, 1], [G4, 2], [A4, 1], [G4, 1], [E4, 2],
  [D4, 1], [E4, 1], [G4, 1], [E4, 1], [D4, 1], [C4, 3],
];
const LULLABY_BEAT = 0.7;

/** Phát nhạc ru lặp lại, nhỏ nhẹ; `volume` 0–1 (theo âm lượng nhạc nền của bố mẹ). Trả về hàm dừng. */
export function playLullaby(volume: number): () => void {
  if (volume <= 0) return () => {};
  const v = 0.06 + 0.18 * volume;
  let i = 0;
  let timer = 0;
  const step = () => {
    const [hz, beats] = LULLABY[i % LULLABY.length];
    tone(hz * 2, beats * LULLABY_BEAT * 1.3, 'sine', v, 0);
    tone(hz * 4, 0.15, 'triangle', v * 0.15, 0); // tiếng chuông hộp nhạc
    if (i % LULLABY.length === 0) tone(C4 / 2, LULLABY_BEAT * 6, 'sine', v * 0.7, 0);
    i++;
    timer = window.setTimeout(step, beats * LULLABY_BEAT * 1000);
  };
  timer = window.setTimeout(step, 600);
  return () => window.clearTimeout(timer);
}
