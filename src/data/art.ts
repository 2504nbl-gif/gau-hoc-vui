// Nét tô theo (hộp 100×100), tranh tô màu (hộp 200×200) và bảng màu dùng trong Mỹ thuật & Toán.

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;

export interface TraceShape { id: string; name: string; strokes: string[]; color: string }

export const TRACE_SHAPES: TraceShape[] = [
  { id: 'circle', name: 'Hình tròn', color: '#ee7c5f', strokes: ['M50 14 A36 36 0 1 1 49.9 14'] },
  { id: 'square', name: 'Hình vuông', color: '#4b9cef', strokes: ['M18 18 L82 18 L82 82 L18 82 L18 18'] },
  { id: 'triangle', name: 'Hình tam giác', color: '#4db463', strokes: ['M50 14 L86 82 L14 82 L50 14'] },
  { id: 'arrow', name: 'Mũi tên', color: '#f08a3c', strokes: ['M14 50 L82 50', 'M60 28 L84 50 L60 72'] },
  { id: 'star', name: 'Ngôi sao', color: '#f2b23a', strokes: ['M50 8 L61 38 L94 38 L67 58 L78 90 L50 70 L22 90 L33 58 L6 38 L39 38 L50 8'] },
  { id: 'heart', name: 'Trái tim', color: '#e0547b', strokes: ['M50 86 C12 60 8 38 22 24 C34 12 48 18 50 32 C52 18 66 12 78 24 C92 38 88 60 50 86'] },
];

export interface DigitDef { n: number; strokes: string[]; looksLike: string; looksEmoji: string; objEmoji: string }

export const DIGITS: DigitDef[] = [
  { n: 0, looksLike: 'quả trứng', looksEmoji: '🥚', objEmoji: '🫙', strokes: ['M50 12 C26 12 22 38 22 50 C22 70 30 88 50 88 C70 88 78 70 78 50 C78 30 72 12 50 12'] },
  { n: 1, looksLike: 'cây bút chì', looksEmoji: '✏️', objEmoji: '🏰', strokes: ['M34 30 L54 12 L54 88'] },
  { n: 2, looksLike: 'con vịt', looksEmoji: '🦆', objEmoji: '🍎', strokes: ['M26 32 C28 12 74 10 74 32 C74 50 40 66 26 88 L78 88'] },
  { n: 3, looksLike: 'cái tai', looksEmoji: '👂', objEmoji: '🐟', strokes: ['M28 20 C40 8 74 12 72 32 C70 46 54 48 46 50 C62 50 78 58 76 72 C74 92 36 94 26 80'] },
  { n: 4, looksLike: 'cánh buồm', looksEmoji: '⛵', objEmoji: '🚗', strokes: ['M58 88 L58 12 L20 64 L80 64'] },
  { n: 5, looksLike: 'cái móc câu', looksEmoji: '🪝', objEmoji: '⭐', strokes: ['M72 14 L34 14 L30 46', 'M30 46 C46 36 74 42 74 64 C74 88 40 92 26 80'] },
  { n: 6, looksLike: 'con ốc sên', looksEmoji: '🐌', objEmoji: '🎈', strokes: ['M70 16 C50 6 26 24 26 58 C26 80 38 90 52 90 C68 90 76 78 76 66 C76 52 64 44 52 44 C40 44 28 52 27 60'] },
  { n: 7, looksLike: 'lá cờ', looksEmoji: '🚩', objEmoji: '🌸', strokes: ['M24 14 L76 14 L44 88'] },
  { n: 8, looksLike: 'người tuyết', looksEmoji: '⛄', objEmoji: '🐥', strokes: ['M50 50 C30 44 30 14 50 14 C70 14 70 44 50 50 C26 56 26 88 50 88 C74 88 74 56 50 50'] },
  { n: 9, looksLike: 'quả bóng bay', looksEmoji: '🎈', objEmoji: '🍓', strokes: ['M74 38 C74 22 62 14 50 14 C36 14 26 24 26 38 C26 52 38 60 50 60 C62 60 74 52 74 38 L74 88'] },
];

import { NUMBER_WORDS } from './phrases';

/** "Số một giống cây bút chì" */
export const looksLikeSentence = (n: number) => `Số ${NUMBER_WORDS[n].toLowerCase()} giống ${DIGITS[n].looksLike}`;
export const digitName = (n: number) => `Số ${NUMBER_WORDS[n].toLowerCase()}`;

export const PALETTE = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#f06ea9', '#8d5a3b', '#9e9e9e', '#222222'];

export interface ColoringPage { id: string; name: string; icon: string; regions: { id: string; d: string }[] }

export const COLORING_PAGES: ColoringPage[] = [
  {
    id: 'house', name: 'Ngôi nhà', icon: '🏠', regions: [
      { id: 'grass', d: 'M0 170 H200 V200 H0 Z' },
      { id: 'sun', d: circle(170, 35, 18) },
      { id: 'chimney', d: 'M130 48 H146 V78 L130 66 Z' },
      { id: 'roof', d: 'M28 96 L100 40 L172 96 Z' },
      { id: 'wall', d: 'M45 96 H155 V170 H45 Z' },
      { id: 'door', d: 'M88 124 H112 V170 H88 Z' },
      { id: 'win1', d: 'M58 108 H80 V130 H58 Z' },
      { id: 'win2', d: 'M120 108 H142 V130 H120 Z' },
    ],
  },
  {
    id: 'fish', name: 'Con cá', icon: '🐟', regions: [
      { id: 'tail', d: 'M148 100 L188 68 L180 100 L188 132 Z' },
      { id: 'body', d: 'M36 100 C58 54 130 54 150 100 C130 146 58 146 36 100 Z' },
      { id: 'stripe', d: 'M98 64 C110 84 110 116 98 136 L112 134 C124 112 124 88 112 66 Z' },
      { id: 'fin', d: 'M86 66 L108 42 L118 68 Z' },
      { id: 'eye', d: circle(66, 92, 7) },
      { id: 'bubble1', d: circle(28, 50, 9) },
      { id: 'bubble2', d: circle(18, 76, 5) },
    ],
  },
  {
    id: 'flower', name: 'Bông hoa', icon: '🌷', regions: [
      { id: 'stem', d: 'M96 100 H104 V165 H96 Z' },
      { id: 'leaf1', d: 'M100 135 C120 114 146 120 152 128 C136 142 116 144 100 135 Z' },
      { id: 'leaf2', d: 'M100 146 C80 125 54 131 48 139 C64 152 84 154 100 146 Z' },
      { id: 'p1', d: circle(100, 45, 22) }, { id: 'p2', d: circle(128.5, 65.7, 22) }, { id: 'p3', d: circle(117.6, 99.3, 22) },
      { id: 'p4', d: circle(82.4, 99.3, 22) }, { id: 'p5', d: circle(71.5, 65.7, 22) },
      { id: 'center', d: circle(100, 75, 18) },
      { id: 'pot', d: 'M68 160 H132 L122 196 H78 Z' },
    ],
  },
  {
    id: 'car', name: 'Ô tô', icon: '🚗', regions: [
      { id: 'cabin', d: 'M55 94 L76 64 H126 L146 94 Z' },
      { id: 'body', d: 'M18 122 L40 92 H142 L170 116 H186 V146 H18 Z' },
      { id: 'win1', d: 'M68 92 L81 72 H98 V92 Z' },
      { id: 'win2', d: 'M104 92 V72 H122 L136 92 Z' },
      { id: 'light', d: 'M176 122 H186 V132 H176 Z' },
      { id: 'wheel1', d: circle(58, 148, 18) },
      { id: 'wheel2', d: circle(150, 148, 18) },
    ],
  },
];
