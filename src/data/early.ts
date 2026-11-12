// Dữ liệu nhóm trò cho bé 3 tuổi: Toán sớm (chia đều, nặng nhẹ, đếm), Ngôn ngữ (vị trí, trái ngược), Cảm xúc.
// Chỉ dùng emoji đã có hình 3D (src/data/emojiIndex.ts). Tên vật trùng nhãn chủ đề có sẵn để dùng lại giọng đã thu.

export interface Thing { emoji: string; name: string }

// ── Chia kẹo cho bạn ─────────────────────────────────────────────────────────
export const SHARE_FRIENDS: Thing[] = [
  { emoji: '🐻', name: 'Con gấu' }, { emoji: '🐱', name: 'Con mèo' }, { emoji: '🐶', name: 'Con chó' },
  { emoji: '🐷', name: 'Con lợn' }, { emoji: '🐸', name: 'Con ếch' }, { emoji: '🐼', name: 'Gấu trúc' },
];
export const SHARE_ITEMS: Thing[] = [
  { emoji: '🍭', name: 'Kẹo mút' }, { emoji: '🥣', name: 'Cái bát' }, { emoji: '🥄', name: 'Cái thìa' }, { emoji: '🍪', name: 'Bánh quy' },
];
/** Từng vòng: mấy bạn ngồi bàn, mỗi bạn mấy cái. */
export const SHARE_ROUNDS = [
  { friends: 2, each: 1 }, { friends: 3, each: 1 }, { friends: 4, each: 1 }, { friends: 2, each: 2 }, { friends: 3, each: 2 },
];

// ── Cân thăng bằng ───────────────────────────────────────────────────────────
/** Cặp [nặng, nhẹ]. */
export const WEIGHT_PAIRS: [Thing, Thing][] = [
  [{ emoji: '🐘', name: 'Con voi' }, { emoji: '🐭', name: 'Con chuột' }],
  [{ emoji: '🍉', name: 'Dưa hấu' }, { emoji: '🍓', name: 'Dâu tây' }],
  [{ emoji: '🦛', name: 'Hà mã' }, { emoji: '🐥', name: 'Gà con' }],
  [{ emoji: '🚌', name: 'Xe buýt' }, { emoji: '🚲', name: 'Xe đạp' }],
  [{ emoji: '🐄', name: 'Con bò sữa' }, { emoji: '🐇', name: 'Con thỏ' }],
  [{ emoji: '🐻', name: 'Con gấu' }, { emoji: '🦋', name: 'Con bướm' }],
  [{ emoji: '🥥', name: 'Quả dừa' }, { emoji: '🍒', name: 'Quả anh đào' }],
  [{ emoji: '🐳', name: 'Cá voi' }, { emoji: '🐟', name: 'Con cá' }],
];

// ── Đếm và chọn số ───────────────────────────────────────────────────────────
export const COUNT_THINGS: Thing[] = [
  { emoji: '🍎', name: 'Quả táo' }, { emoji: '⭐', name: 'Ngôi sao' }, { emoji: '🐟', name: 'Con cá' }, { emoji: '🦆', name: 'Con vịt' },
  { emoji: '🎈', name: 'Bóng bay' }, { emoji: '🦋', name: 'Con bướm' }, { emoji: '🐞', name: 'Bọ rùa' }, { emoji: '🍓', name: 'Dâu tây' },
];
/** Từng vòng: số vật [ít nhất, nhiều nhất] và kiểu thẻ đáp án (chấm trước, chữ số sau). */
export const COUNT_ROUNDS: { min: number; max: number; card: 'dots' | 'digit' }[] = [
  { min: 1, max: 2, card: 'dots' }, { min: 2, max: 3, card: 'dots' }, { min: 3, max: 4, card: 'dots' },
  { min: 3, max: 5, card: 'digit' }, { min: 4, max: 5, card: 'digit' },
];

// ── Ở đâu thế? ───────────────────────────────────────────────────────────────
export type Furniture = 'table' | 'box';
export type Spot = 'on' | 'under' | 'in' | 'beside';
export interface Place { id: string; furniture: Furniture; spot: Spot; name: string }
export const PLACES: Place[] = [
  { id: 'on-table', furniture: 'table', spot: 'on', name: 'Gấu ở trên bàn' },
  { id: 'under-table', furniture: 'table', spot: 'under', name: 'Gấu ở dưới bàn' },
  { id: 'beside-table', furniture: 'table', spot: 'beside', name: 'Gấu ở cạnh bàn' },
  { id: 'in-box', furniture: 'box', spot: 'in', name: 'Gấu ở trong hộp' },
  { id: 'on-box', furniture: 'box', spot: 'on', name: 'Gấu ở trên hộp' },
  { id: 'beside-box', furniture: 'box', spot: 'beside', name: 'Gấu ở cạnh hộp' },
];

// ── Trái ngược ───────────────────────────────────────────────────────────────
/** Hình của một từ: emoji, hoặc hình vẽ riêng (cốc nước đầy/vơi, cây cao/thấp). */
export type OppositeArt = { emoji: string; scale?: number } | { glass: 'full' | 'low' } | { tree: 'tall' | 'short' };
export interface OppositeSide { name: string; art: OppositeArt }
export const OPPOSITES: { id: string; a: OppositeSide; b: OppositeSide }[] = [
  { id: 'size', a: { name: 'To', art: { emoji: '🐘' } }, b: { name: 'Nhỏ', art: { emoji: '🐭', scale: 0.5 } } },
  { id: 'heat', a: { name: 'Nóng', art: { emoji: '🔥' } }, b: { name: 'Lạnh', art: { emoji: '❄️' } } },
  { id: 'day', a: { name: 'Ban ngày', art: { emoji: '☀️' } }, b: { name: 'Ban đêm', art: { emoji: '🌙' } } },
  { id: 'mood', a: { name: 'Vui vẻ', art: { emoji: '😀' } }, b: { name: 'Buồn', art: { emoji: '😢' } } },
  { id: 'speed', a: { name: 'Nhanh', art: { emoji: '🐇' } }, b: { name: 'Chậm', art: { emoji: '🐢' } } },
  { id: 'fill', a: { name: 'Đầy', art: { glass: 'full' } }, b: { name: 'Vơi', art: { glass: 'low' } } },
  { id: 'height', a: { name: 'Cao', art: { tree: 'tall' } }, b: { name: 'Thấp', art: { tree: 'short' } } },
];

// ── Bạn thấy thế nào? ────────────────────────────────────────────────────────
export type FeelingId = 'happy' | 'sad' | 'scared' | 'angry' | 'surprised';
/** Khuôn mặt + tên lấy từ chủ đề Cảm xúc (đã có giọng); `named` là câu gọi tên cảm xúc sau khi bé chọn đúng. */
export const FEELINGS: Record<FeelingId, Thing & { named: string }> = {
  happy: { emoji: '😀', name: 'Vui vẻ', named: 'Bạn gấu vui quá!' },
  sad: { emoji: '😢', name: 'Buồn', named: 'Bạn gấu buồn quá!' },
  scared: { emoji: '😨', name: 'Sợ hãi', named: 'Bạn gấu sợ quá!' },
  angry: { emoji: '😠', name: 'Tức giận', named: 'Bạn gấu giận quá!' },
  surprised: { emoji: '😲', name: 'Ngạc nhiên', named: 'Bạn gấu ngạc nhiên quá!' },
};
/** Tình huống: câu kể + các hình minh họa đặt cạnh bạn gấu (`flip` = hình bị rơi, lộn ngược). */
export interface Situation { feeling: FeelingId; text: string; props: Thing[]; flip?: boolean }
export const SITUATIONS: Situation[] = [
  { feeling: 'happy', text: 'Bạn gấu được tặng quà.', props: [{ emoji: '🎁', name: 'Hộp quà' }] },
  { feeling: 'happy', text: 'Bạn gấu được ăn bánh sinh nhật.', props: [{ emoji: '🎂', name: 'Bánh sinh nhật' }] },
  { feeling: 'sad', text: 'Bạn gấu làm rơi kem.', props: [{ emoji: '🍦', name: 'Kem ốc quế' }], flip: true },
  { feeling: 'sad', text: 'Bóng bay của bạn gấu bay mất rồi.', props: [{ emoji: '🎈', name: 'Bóng bay' }] },
  { feeling: 'scared', text: 'Trời có sấm to.', props: [{ emoji: '⛈️', name: 'Có sấm sét' }] },
  { feeling: 'scared', text: 'Bạn gấu gặp một con rắn.', props: [{ emoji: '🐍', name: 'Con rắn' }] },
  { feeling: 'angry', text: 'Bạn khỉ giật mất gấu bông của bạn gấu.', props: [{ emoji: '🐒', name: 'Con khỉ' }, { emoji: '🧸', name: 'Gấu bông' }] },
  { feeling: 'surprised', text: 'Một chú thỏ nhảy ra từ hộp quà.', props: [{ emoji: '🐇', name: 'Con thỏ' }, { emoji: '🎁', name: 'Hộp quà' }] },
  { feeling: 'surprised', text: 'Bạn gấu thấy cầu vồng thật to.', props: [{ emoji: '🌈', name: 'Cầu vồng' }] },
];

/** Tên/câu mới (chưa có trong chủ đề nào) — PHRASES gom vào để thu giọng. */
export const EARLY_NAMES = [
  ...PLACES.map((p) => p.name),
  ...OPPOSITES.flatMap((o) => [o.a.name, o.b.name]),
  ...Object.values(FEELINGS).map((f) => f.named),
  ...SITUATIONS.map((s) => s.text),
];
