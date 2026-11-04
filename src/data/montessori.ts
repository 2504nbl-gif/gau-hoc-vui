// Dữ liệu 3 trò kiểu Montessori cho bé nhỏ: Phân loại màu, To và nhỏ, Mẹ và con.
// Chỉ dùng emoji đã có hình 3D (src/data/emojiIndex.ts). Tên trùng nhãn chủ đề có sẵn để dùng lại giọng đã thu.

export interface Thing { emoji: string; name: string }

export interface ColorBin { id: 'red' | 'yellow' | 'green'; name: string; hex: string; items: Thing[] }

/** Giỏ màu và đồ vật cùng màu (tên màu lấy từ chủ đề Màu sắc). */
export const COLOR_BINS: ColorBin[] = [
  { id: 'red', name: 'Màu đỏ', hex: '#e53935', items: [
    { emoji: '🍎', name: 'Quả táo' }, { emoji: '🍓', name: 'Dâu tây' }, { emoji: '🍅', name: 'Quả cà chua' },
    { emoji: '🍒', name: 'Quả anh đào' }, { emoji: '🌹', name: 'Hoa hồng' }, { emoji: '🐞', name: 'Bọ rùa' }, { emoji: '🚒', name: 'Xe cứu hỏa' },
  ] },
  { id: 'yellow', name: 'Màu vàng', hex: '#fdd835', items: [
    { emoji: '🍌', name: 'Quả chuối' }, { emoji: '🌻', name: 'Hoa hướng dương' }, { emoji: '🌽', name: 'Bắp ngô' },
    { emoji: '⭐', name: 'Ngôi sao' }, { emoji: '🧀', name: 'Phô mai' }, { emoji: '🐥', name: 'Gà con' },
  ] },
  { id: 'green', name: 'Màu xanh lá', hex: '#43a047', items: [
    { emoji: '🍃', name: 'Chiếc lá' }, { emoji: '🍏', name: 'Táo xanh' }, { emoji: '🥦', name: 'Bông cải xanh' },
    { emoji: '🐸', name: 'Con ếch' }, { emoji: '🥒', name: 'Quả dưa chuột' }, { emoji: '🍀', name: 'Cỏ bốn lá' }, { emoji: '🐢', name: 'Con rùa' },
  ] },
];

/** Con vật cho trò To và nhỏ (cùng hình, hai cỡ). */
export const SIZE_ANIMALS: Thing[] = [
  { emoji: '🐶', name: 'Con chó' }, { emoji: '🐱', name: 'Con mèo' }, { emoji: '🐴', name: 'Con ngựa' },
  { emoji: '🐷', name: 'Con lợn' }, { emoji: '🐘', name: 'Con voi' }, { emoji: '🐻', name: 'Con gấu' },
  { emoji: '🦆', name: 'Con vịt' }, { emoji: '🐔', name: 'Con gà' }, { emoji: '🐸', name: 'Con ếch' },
  { emoji: '🐢', name: 'Con rùa' }, { emoji: '🐑', name: 'Con cừu' }, { emoji: '🐒', name: 'Con khỉ' },
];

/** Mẹ và con. Con có emoji riêng (gà con) thì vẽ cỡ vừa; dùng chung emoji với mẹ thì vẽ nhỏ hơn. */
export interface MomBaby { id: string; mom: Thing; baby: Thing }
const pair = (id: string, emoji: string, mom: string, baby: string, babyEmoji = emoji): MomBaby =>
  ({ id, mom: { emoji, name: mom }, baby: { emoji: babyEmoji, name: baby } });

export const MOM_BABY: MomBaby[] = [
  pair('ga', '🐔', 'Gà mẹ', 'Gà con', '🐥'),
  pair('vit', '🦆', 'Vịt mẹ', 'Vịt con'),
  pair('meo', '🐱', 'Mèo mẹ', 'Mèo con'),
  pair('cho', '🐶', 'Chó mẹ', 'Chó con'),
  pair('bo', '🐄', 'Bò mẹ', 'Bê con'),
  pair('ngua', '🐴', 'Ngựa mẹ', 'Ngựa con'),
  pair('lon', '🐷', 'Lợn mẹ', 'Lợn con'),
  pair('cuu', '🐑', 'Cừu mẹ', 'Cừu con'),
  pair('voi', '🐘', 'Voi mẹ', 'Voi con'),
  pair('khi', '🐒', 'Khỉ mẹ', 'Khỉ con'),
  pair('gau', '🐻', 'Gấu mẹ', 'Gấu con'),
];

/** Tên mới (chưa có trong chủ đề nào) — PHRASES gom vào để thu giọng. */
export const MONTESSORI_NAMES = ['Chiếc lá', ...MOM_BABY.flatMap((p) => [p.mom.name, p.baby.name])];
