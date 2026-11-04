// Âm thanh cho trò "Bé nghe xem đây là tiếng gì?" — tất cả tự sinh bằng Web Audio, không cần file.
import { noise, tone, NOTE_HZ } from './sfx';

export interface SoundDef { id: string; name: string; icon: string; play: () => void; duration: number }

const seq = (notes: [number, number][], type: OscillatorType = 'triangle', vol = 0.22) => {
  let t = 0;
  for (const [f, d] of notes) { if (f) tone(f, d * 0.95, type, vol, t); t += d; }
};

export const SOUNDS: SoundDef[] = [
  { id: 'drum', name: 'Cái trống', icon: '🥁', duration: 1.4, play: () => [0, 0.35, 0.7, 0.9].forEach((d) => { tone(110, 0.35, 'sine', 0.5, d, 45); noise(0.08, d, 'lowpass', 900, 200, 0.25); }) },
  { id: 'bell', name: 'Cái chuông', icon: '🔔', duration: 1.6, play: () => [0, 0.5].forEach((d) => { tone(1320, 1.2, 'sine', 0.22, d); tone(1980, 0.8, 'sine', 0.08, d); tone(2640, 0.5, 'sine', 0.05, d); }) },
  { id: 'piano', name: 'Đàn piano', icon: '🎹', duration: 1.6, play: () => seq([[NOTE_HZ.C4, 0.25], [NOTE_HZ.E4, 0.25], [NOTE_HZ.G4, 0.25], [NOTE_HZ.C5, 0.6]]) },
  { id: 'trumpet', name: 'Cái kèn', icon: '🎺', duration: 1.4, play: () => seq([[392, 0.2], [392, 0.2], [523, 0.5], [392, 0.4]], 'sawtooth', 0.09) },
  { id: 'rain', name: 'Trời mưa', icon: '🌧️', duration: 2, play: () => { noise(2, 0, 'highpass', 3000, 2500, 0.12); for (let i = 0; i < 30; i++) noise(0.02, Math.random() * 2, 'bandpass', 5000, 4000, 0.2); } },
  { id: 'thunder', name: 'Tiếng sấm', icon: '⛈️', duration: 2, play: () => { noise(1.8, 0, 'lowpass', 400, 60, 0.6); noise(0.3, 0.05, 'lowpass', 1500, 300, 0.4); } },
  { id: 'bird', name: 'Chim hót', icon: '🐦', duration: 1.6, play: () => [0, 0.25, 0.5, 0.95, 1.15].forEach((d) => tone(2600 + Math.random() * 600, 0.12, 'sine', 0.15, d, 3800)) },
  { id: 'clock', name: 'Đồng hồ', icon: '⏰', duration: 2, play: () => [0, 0.5, 1, 1.5].forEach((d, i) => { tone(i % 2 ? 1400 : 1800, 0.04, 'square', 0.12, d); noise(0.03, d, 'highpass', 4000, 3000, 0.2); }) },
  { id: 'horn', name: 'Còi ô tô', icon: '🚗', duration: 1.4, play: () => [0, 0.55].forEach((d) => { tone(440, 0.4, 'square', 0.08, d); tone(554, 0.4, 'square', 0.06, d); }) },
  { id: 'cat', name: 'Con mèo kêu', icon: '🐱', duration: 1.6, play: () => [0, 0.8].forEach((d) => { tone(700, 0.6, 'triangle', 0.2, d, 520); tone(1050, 0.5, 'sine', 0.05, d, 800); }) },
];
