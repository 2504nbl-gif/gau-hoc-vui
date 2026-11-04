// Nhạc nền: giai điệu ru nhẹ tự sinh bằng Web Audio (không cần file mp3).
// Ngũ cung Đô–Rê–Mi–Son–La nên nốt nào ghép với nốt nào cũng êm. Tự hạ nhỏ khi cô đang đọc.
import { audioCtx, musicOut } from './AudioManager';
import { NOTE_HZ, tone } from './sfx';
import { isSpeaking } from './voice';

/** Âm lượng tối đa của kênh nhạc (ở mức 100% trong cài đặt) — vẫn nhỏ hơn hẳn giọng đọc. */
const MAX_GAIN = 0.5;
/** Khi cô đang đọc, nhạc còn bấy nhiêu phần. */
const DUCK = 0.25;
const BEAT = 0.62; // giây mỗi phách (~97 nhịp/phút, nhịp ru)

const C4 = NOTE_HZ.C4, D4 = NOTE_HZ.D4, E4 = NOTE_HZ.E4, G4 = NOTE_HZ.G4, A4 = NOTE_HZ.A4, C5 = NOTE_HZ.C5;
const D5 = D4 * 2, E5 = E4 * 2;
/** 4 câu nhạc, mỗi câu 8 phách: [tần số, số phách]; 0 = nghỉ. */
const PHRASES: [number, number][][] = [
  [[E4, 1], [G4, 1], [A4, 1], [G4, 1], [E4, 2], [0, 2]],
  [[D4, 1], [E4, 1], [G4, 2], [E4, 1], [D4, 1], [C4, 2]],
  [[G4, 1], [A4, 1], [C5, 1], [D5, 1], [E5, 2], [C5, 2]],
  [[A4, 1], [G4, 1], [E4, 1], [D4, 1], [C4, 3], [0, 1]],
];
/** Nốt trầm đệm ở đầu mỗi nửa câu. */
const BASS = [[C4 / 2, G4 / 4], [G4 / 4, C4 / 2], [A4 / 4, E4 / 2], [G4 / 4, C4 / 2]];

let enabled = false;
let muted = false;
let level = 0.35;
let timer = 0;
let nextAt = 0;
let step = 0;

function targetGain() {
  if (!enabled || muted || document.hidden) return 0;
  return level * MAX_GAIN * (isSpeaking() || ducked ? DUCK : 1);
}

let ducked = false;
/** Hạ nhỏ nhạc nền theo yêu cầu (vd Gấu biết nói đang mở micro nghe bé). */
export function duckMusic(on: boolean) {
  ducked = on;
}

/** Xếp lịch trước ~1 giây, chạy lại mỗi 150 ms (kiểu "lookahead scheduler"). */
function tick() {
  const c = audioCtx();
  const out = musicOut();
  if (!c || !out) return;
  out.gain.setTargetAtTime(targetGain(), c.currentTime, 0.25);
  if (c.state !== 'running' || targetGain() === 0) { nextAt = 0; return; }
  if (nextAt < c.currentTime) nextAt = c.currentTime + 0.1;
  while (nextAt < c.currentTime + 1) {
    const phrase = PHRASES[step % PHRASES.length];
    const at = nextAt - c.currentTime;
    let beats = 0;
    for (const [hz, b] of phrase) {
      if (hz) {
        tone(hz, b * BEAT * 1.4, 'sine', 0.22, at + beats * BEAT, undefined, out);
        tone(hz * 2, b * BEAT * 0.6, 'triangle', 0.03, at + beats * BEAT, undefined, out); // tiếng chuông nhỏ
      }
      beats += b;
    }
    BASS[step % BASS.length].forEach((hz, i) => tone(hz, BEAT * 4, 'sine', 0.16, at + i * 4 * BEAT, undefined, out));
    nextAt += beats * BEAT;
    step++;
  }
}

function ensureTimer() {
  const need = enabled && !muted;
  if (need && !timer) timer = window.setInterval(tick, 150);
  if (!need && timer) {
    window.clearInterval(timer);
    timer = 0;
    nextAt = 0;
    const c = audioCtx();
    musicOut()?.gain.setTargetAtTime(0, c?.currentTime ?? 0, 0.15);
  }
}

/** Bật/tắt và âm lượng (0–1) theo cài đặt của bố mẹ. */
export function setMusic(on: boolean, volume: number) {
  enabled = on;
  level = volume;
  ensureTimer();
}

/** Tạm tắt nhạc (trò âm nhạc/đàn, màn đi ngủ…). */
export function muteMusic(m: boolean) {
  muted = m;
  ensureTimer();
}
