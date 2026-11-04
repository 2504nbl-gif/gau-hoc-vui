// Giai điệu vui cho Gấu nhảy múa (~7 giây), tự sinh bằng Web Audio.
// Phát theo từng nhịp bằng hẹn giờ để dừng được ngay khi bé chạm đóng.
import type { NoteName } from '@/types/curriculum';
import { NOTE_HZ, noise, tone } from './sfx';

/** Độ dài một nốt móc đơn (giây). */
export const STEP = 0.22;
/** Nhịp nảy của gấu = 2 móc đơn (1 phách). */
export const BEAT_S = STEP * 2;

type N = NoteName | null;
// 4 ô nhịp × 8 móc đơn. null = lặng.
const MELODY: N[] = [
  'C4', 'E4', 'G4', 'E4', 'C4', 'E4', 'G4', null,
  'A4', 'G4', 'F4', 'E4', 'D4', 'E4', 'C4', null,
  'E4', 'F4', 'G4', 'G4', 'A4', 'G4', 'E4', 'C4',
  'D4', 'G4', 'E4', 'D4', 'C4', null, 'C5', null,
];
// Bè trầm theo phách (2 móc đơn một nốt).
const BASS: NoteName[] = ['C4', 'G4', 'C4', 'G4', 'F4', 'C4', 'G4', 'C4', 'C4', 'G4', 'F4', 'C4', 'G4', 'G4', 'C4', 'C4'];

/** Bắt đầu phát, trả về hàm dừng. */
export function playDanceTune(onEnd?: () => void): () => void {
  let i = 0;
  const step = () => {
    if (i >= MELODY.length) { stop(); onEnd?.(); return; }
    const n = MELODY[i];
    if (n) { tone(NOTE_HZ[n] * 2, STEP * 1.6, 'triangle', 0.16); tone(NOTE_HZ[n] * 4, 0.08, 'sine', 0.03); }
    if (i % 2 === 0) {
      tone(NOTE_HZ[BASS[i / 2]] / 2, STEP * 1.8, 'sine', 0.2);
      noise(0.06, 0, 'lowpass', 300, 80, 0.3); // trống "bùm"
    } else {
      noise(0.04, 0, 'highpass', 7000, 5000, 0.07); // "xì" nhẹ
    }
    i++;
  };
  step();
  const timer = window.setInterval(step, STEP * 1000);
  function stop() { window.clearInterval(timer); }
  return stop;
}
