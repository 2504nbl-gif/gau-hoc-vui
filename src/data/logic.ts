// Dữ liệu nhóm trò "Phát triển tư duy" cho bé 3 tuổi (features/logic):
// Tìm bạn khác loại, Hình gì tiếp theo?, Xếp hình 4 mảnh, Mê cung, Thiếu bạn nào?, Chuyện gì trước chuyện gì sau?
// Chỉ dùng emoji đã có hình 3D (src/data/emojiIndex.ts). Tên ưu tiên trùng nhãn chủ đề có sẵn để dùng lại giọng đã thu.

/** Chủ đề khác hẳn nhau cho trò Tìm bạn khác loại (3 bạn cùng chủ đề + 1 bạn chủ đề khác). */
export const ODD_TOPIC_IDS = ['pets', 'fruits', 'vehicles', 'clothes'];

/** Màu cho lượt "khác màu" (tên trùng chủ đề Màu sắc). */
export const ODD_COLORS = [
  { hex: '#e53935', name: 'Màu đỏ' }, { hex: '#fdd835', name: 'Màu vàng' },
  { hex: '#43a047', name: 'Màu xanh lá' }, { hex: '#1e88e5', name: 'Màu xanh dương' },
];

/** Chấm màu cho trò quy luật — tên ngắn một tiếng để đọc thành nhịp "đỏ, xanh, đỏ, xanh…". */
export const PATTERN_COLORS = [
  { hex: '#e53935', name: 'Đỏ' }, { hex: '#1e88e5', name: 'Xanh' }, { hex: '#fdd835', name: 'Vàng' },
];

/** Các lượt quy luật, dễ → khó. `shown` là chuỗi đang hiện, `answer` là hình tiếp theo. */
export const PATTERN_ROUNDS: { shown: string; answer: string; choices: number; colors?: boolean }[] = [
  { shown: 'ABAB', answer: 'A', choices: 2, colors: true },
  { shown: 'ABAB', answer: 'A', choices: 2 },
  { shown: 'AABAA', answer: 'B', choices: 3 },
  { shown: 'ABBAB', answer: 'B', choices: 3 },
  { shown: 'ABCAB', answer: 'C', choices: 3 },
];

/** Tranh ghép: nền CSS + vài emoji 3D. Mỗi phần: [emoji, tâm x%, tâm y%, rộng % bề ngang tranh]. */
export interface JigsawPic { id: string; name: string; bg: string; parts: [string, number, number, number][] }

/** Tranh vuông cắt 2×2: một hình lớn ở giữa, mỗi góc có một chi tiết riêng để bé nhận ra mảnh. */
export const JIGSAW_EASY: JigsawPic[] = [
  { id: 'bear', name: 'Con gấu', bg: 'radial-gradient(circle at 50% 55%, #fff3c4 0 45%, #ffd978 100%)',
    parts: [['🐻', 50, 54, 72], ['☁️', 15, 14, 22], ['☀️', 86, 14, 20], ['🌷', 12, 87, 18], ['🍯', 88, 87, 18]] },
  { id: 'car', name: 'Xe ô tô', bg: 'linear-gradient(#bfe6ff 0 66%, #9aa7b5 66%)',
    parts: [['🚗', 50, 56, 72], ['☁️', 18, 15, 24], ['☀️', 86, 14, 20], ['🌳', 10, 50, 16], ['🚦', 91, 50, 13]] },
];
/** Tranh vuông cắt 2×2: cảnh ghép nhiều hình. */
export const JIGSAW_SCENES: JigsawPic[] = [
  { id: 'house', name: 'Ngôi nhà', bg: 'linear-gradient(#bfe6ff 0 60%, #a8da72 60%)',
    parts: [['🏠', 42, 50, 56], ['🌳', 86, 46, 26], ['☀️', 14, 13, 20], ['☁️', 70, 13, 22], ['🌻', 12, 84, 17], ['🐶', 80, 84, 20]] },
  { id: 'sea', name: 'Đại dương', bg: 'linear-gradient(#8fd8ff, #2f8fd8 78%, #e9d29a 78%)',
    parts: [['🐳', 34, 28, 48], ['🐠', 78, 26, 22], ['🐙', 74, 62, 32], ['🐢', 24, 64, 24], ['🪸', 50, 88, 16], ['🐚', 88, 90, 12]] },
];
/** Tranh ngang 3:2 cắt 2×3 cho lượt cuối. */
export const JIGSAW_WIDE: JigsawPic[] = [
  { id: 'farm', name: 'Nông trại', bg: 'linear-gradient(#cfefff 0 52%, #a8da72 52%)',
    parts: [['🏡', 17, 36, 27], ['🌳', 50, 30, 20], ['☀️', 87, 16, 13], ['🐷', 14, 80, 15], ['🐄', 48, 72, 24], ['🐔', 82, 76, 16], ['🌻', 67, 86, 9]] },
  { id: 'jungle', name: 'Rừng rậm', bg: 'linear-gradient(#d9f3c2 0 48%, #8fd16a 48%)',
    parts: [['🌴', 14, 30, 24], ['🦜', 50, 18, 12], ['🌳', 86, 30, 22], ['🦒', 18, 70, 24], ['🐘', 50, 68, 28], ['🦁', 84, 74, 20]] },
];

/** Mê cung: đường đi là các đoạn thẳng nối tâm ô trên lưới w×h; [x1, y1, x2, y2]. Dễ → khó (có thêm ngõ cụt). */
export interface Maze { w: number; h: number; start: [number, number]; goal: [number, number]; segs: [number, number, number, number][] }
export const MAZES: Maze[] = [
  { w: 5, h: 3, start: [0, 2], goal: [4, 0], segs: [[0, 2, 2, 2], [2, 2, 2, 0], [2, 0, 4, 0]] },
  { w: 6, h: 3, start: [0, 0], goal: [5, 2], segs: [[0, 0, 0, 2], [0, 2, 2, 2], [2, 2, 2, 0], [2, 0, 5, 0], [4, 0, 4, 2], [4, 2, 5, 2]] },
  { w: 6, h: 4, start: [0, 3], goal: [5, 3],
    segs: [[0, 3, 0, 1], [0, 1, 2, 1], [2, 1, 2, 3], [2, 3, 3, 3], [2, 1, 2, 0], [2, 0, 5, 0], [5, 0, 5, 3], [5, 2, 3, 2]] },
  { w: 7, h: 4, start: [0, 0], goal: [6, 3],
    segs: [[0, 0, 0, 3], [0, 3, 2, 3], [2, 3, 2, 1], [2, 1, 1, 1], [2, 1, 4, 1], [4, 1, 4, 3], [4, 3, 3, 3], [4, 1, 4, 0], [4, 0, 6, 0], [6, 0, 6, 3], [6, 2, 5, 2]] },
];

/** Một bước của câu chuyện: hình chính + hình phụ ở góc (badge) hoặc vết bẩn vẽ bằng CSS (mud). */
export interface StoryStep { emoji: string; name: string; badge?: string; mud?: boolean }
export interface StorySeq { id: string; steps: [StoryStep, StoryStep, StoryStep]; tale: string }

/** Chuỗi 3 tranh theo thứ tự trước → sau; `tale` là câu app kể lại khi bé xếp xong. */
export const STORY_SEQS: StorySeq[] = [
  { id: 'chick', tale: 'Quả trứng nở ra gà con. Gà con lớn lên thành gà mẹ.',
    steps: [{ emoji: '🥚', name: 'Quả trứng' }, { emoji: '🐥', name: 'Gà con' }, { emoji: '🐔', name: 'Gà mẹ' }] },
  { id: 'plant', tale: 'Gieo hạt xuống đất. Hạt nảy mầm. Rồi cây nở thành bông hoa.',
    steps: [{ emoji: '🌰', name: 'Hạt giống' }, { emoji: '🌿', name: 'Mầm cây' }, { emoji: '🌷', name: 'Bông hoa' }] },
  { id: 'day', tale: 'Buổi sáng mặt trời mọc. Buổi trưa trời nắng. Buổi tối trăng lên.',
    steps: [{ emoji: '🌅', name: 'Buổi sáng' }, { emoji: '☀️', name: 'Buổi trưa' }, { emoji: '🌙', name: 'Buổi tối' }] },
  { id: 'bath', tale: 'Lợn con bị bẩn. Lợn con đi tắm. Thế là lợn con sạch sẽ, thơm tho.',
    steps: [{ emoji: '🐷', name: 'Lợn con bị bẩn', mud: true }, { emoji: '🐷', name: 'Lợn con đi tắm', badge: '🛁' }, { emoji: '🐷', name: 'Lợn con sạch sẽ', badge: '✨' }] },
  { id: 'butterfly', tale: 'Quả trứng nở ra con sâu. Con sâu lớn lên, hóa thành con bướm.',
    steps: [{ emoji: '🥚', name: 'Quả trứng' }, { emoji: '🐛', name: 'Con sâu' }, { emoji: '🦋', name: 'Con bướm' }] },
  { id: 'rain', tale: 'Mây kéo đến. Trời đổ mưa. Mưa tạnh thì có cầu vồng.',
    steps: [{ emoji: '☁️', name: 'Đám mây' }, { emoji: '🌧️', name: 'Mưa' }, { emoji: '🌈', name: 'Cầu vồng' }] },
  { id: 'morning', tale: 'Bé thức dậy. Bé đánh răng. Rồi bé đeo cặp đi học.',
    steps: [{ emoji: '⏰', name: 'Thức dậy' }, { emoji: '🪥', name: 'Đánh răng' }, { emoji: '🎒', name: 'Đi học' }] },
];

/** Chủ đề lấy hình cho trò Thiếu bạn nào? */
export const MISSING_TOPIC_IDS = ['pets', 'fruits', 'toys', 'vehicles', 'wild'];

/** Câu/tên mới (chưa có trong chủ đề nào) — PHRASES gom vào để thu giọng. */
export const LOGIC_NAMES = [
  ...PATTERN_COLORS.map((c) => c.name),
  ...STORY_SEQS.flatMap((s) => [s.tale, ...s.steps.map((x) => x.name)]),
];
