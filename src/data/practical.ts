// Dữ liệu nhóm trò Montessori "Thực hành cuộc sống + Giác quan" (bé 3 tuổi): features/practical/.
// Chỉ dùng emoji đã có hình 3D (src/data/emojiIndex.ts). Tên đồ vật trùng nhãn chủ đề có sẵn để dùng lại giọng đã thu.
import type { Thing } from './montessori';

/** Rót nước: vạch đích (tỉ lệ chiều cao cốc) và câu mời của từng vòng — dễ (đầy) → khó (ít). */
export interface PourLevel { id: 'full' | 'half' | 'little'; target: number; ask: string }
export const POUR_LEVELS: PourLevel[] = [
  { id: 'full', target: 0.82, ask: 'Bé rót đầy cốc nhé!' },
  { id: 'half', target: 0.5, ask: 'Bé rót nửa cốc thôi nhé!' },
  { id: 'little', target: 0.25, ask: 'Bé rót một ít nước thôi nhé!' },
];

/** Xếp từ to đến nhỏ: số vật và chiều xếp của từng vòng. */
export const SIZE_ROUNDS: { n: number; asc: boolean }[] = [
  { n: 3, asc: false }, { n: 4, asc: false }, { n: 5, asc: false }, { n: 4, asc: true }, { n: 5, asc: true },
];
export const SIZE_THINGS: Thing[] = [
  { emoji: '🐻', name: 'Con gấu' }, { emoji: '🍎', name: 'Quả táo' }, { emoji: '⭐', name: 'Ngôi sao' },
  { emoji: '⚽', name: 'Quả bóng' }, { emoji: '🐘', name: 'Con voi' }, { emoji: '🚗', name: 'Xe ô tô' },
  { emoji: '🐢', name: 'Con rùa' }, { emoji: '🌳', name: 'Cái cây' }, { emoji: '🧸', name: 'Gấu bông' },
];

/** Dọn đồ đúng chỗ: ba nơi cất đồ và đồ vật thuộc về nơi đó. */
export interface TidyPlace { id: 'toys' | 'clothes' | 'food'; name: string; hex: string; items: Thing[] }
export const TIDY_PLACES: TidyPlace[] = [
  { id: 'toys', name: 'Thùng đồ chơi', hex: '#f2b23a', items: [
    { emoji: '🧸', name: 'Gấu bông' }, { emoji: '⚽', name: 'Quả bóng' }, { emoji: '🚂', name: 'Tàu hỏa' },
    { emoji: '🥁', name: 'Cái trống' }, { emoji: '🧩', name: 'Xếp hình' }, { emoji: '🎲', name: 'Xúc xắc' }, { emoji: '🪁', name: 'Cánh diều' },
  ] },
  { id: 'clothes', name: 'Tủ quần áo', hex: '#8d71e8', items: [
    { emoji: '👕', name: 'Áo phông' }, { emoji: '👖', name: 'Quần dài' }, { emoji: '👗', name: 'Cái váy' },
    { emoji: '🧥', name: 'Áo khoác' }, { emoji: '🧦', name: 'Đôi tất' }, { emoji: '🧢', name: 'Cái mũ' }, { emoji: '🧣', name: 'Khăn quàng' },
  ] },
  { id: 'food', name: 'Tủ lạnh', hex: '#38b6e8', items: [
    { emoji: '🍎', name: 'Quả táo' }, { emoji: '🥛', name: 'Cốc sữa' }, { emoji: '🧀', name: 'Phô mai' },
    { emoji: '🥕', name: 'Củ cà rốt' }, { emoji: '🍉', name: 'Dưa hấu' }, { emoji: '🍇', name: 'Chùm nho' }, { emoji: '🍓', name: 'Dâu tây' },
  ] },
];
/** Số nơi của từng vòng (mỗi nơi 2 món). */
export const TIDY_ROUNDS = [2, 2, 3, 3];

/** Ghép nửa hình: hình cân đối, cắt đôi vẫn nhận ra. */
export const HALF_THINGS: Thing[] = [
  { emoji: '🍎', name: 'Quả táo' }, { emoji: '🦋', name: 'Con bướm' }, { emoji: '🏠', name: 'Ngôi nhà' },
  { emoji: '⭐', name: 'Ngôi sao' }, { emoji: '🐞', name: 'Bọ rùa' }, { emoji: '🍉', name: 'Dưa hấu' },
  { emoji: '⚽', name: 'Quả bóng' }, { emoji: '🌻', name: 'Hoa hướng dương' }, { emoji: '🐻', name: 'Con gấu' },
  { emoji: '🐱', name: 'Con mèo' }, { emoji: '🚗', name: 'Xe ô tô' }, { emoji: '🐟', name: 'Con cá' },
];
/** Số hình và chiều cắt của từng vòng: 'v' cắt dọc (trái/phải), 'h' cắt ngang (trên/dưới). */
export const HALF_ROUNDS: { n: number; cut: 'v' | 'h' }[] = [
  { n: 2, cut: 'v' }, { n: 2, cut: 'h' }, { n: 3, cut: 'v' }, { n: 3, cut: 'h' },
];

/** Cài cúc / kéo khóa: xen kẽ hai khung thực hành, khó dần (tol = độ lệch ngang cho phép khi kéo khóa). */
export type FastenRound = { kind: 'buttons'; n: number; cloth: string } | { kind: 'zip'; cloth: string; tol: number };
export const FASTEN_ROUNDS: FastenRound[] = [
  { kind: 'buttons', n: 3, cloth: '#4b9cef' },
  { kind: 'zip', cloth: '#ee7c5f', tol: 90 },
  { kind: 'buttons', n: 4, cloth: '#4db463' },
  { kind: 'zip', cloth: '#8d71e8', tol: 55 },
];
export const BUTTON_COLORS = ['#f2b23a', '#e0547b', '#fff8e6', '#2bb0a3'];

/** Tưới cây: số chậu của từng vòng và các loài hoa nở ra. */
export const WATER_ROUNDS = [2, 3, 3, 4];
export const FLOWERS: Thing[] = [
  { emoji: '🌷', name: 'Hoa tulip' }, { emoji: '🌻', name: 'Hoa hướng dương' }, { emoji: '🌹', name: 'Hoa hồng' },
  { emoji: '🌼', name: 'Hoa cúc' }, { emoji: '🌸', name: 'Bông hoa' },
];

/** Tên mới (chưa có trong chủ đề nào) — PHRASES gom vào để thu giọng. */
export const PRACTICAL_NAMES = ['Bình nước', 'Thùng đồ chơi', 'Tủ quần áo', 'Tủ lạnh', 'Cái cúc', 'Khóa kéo', 'Áo sơ mi', 'Bình tưới', 'Chậu cây',
  ...POUR_LEVELS.map((l) => l.ask)];
