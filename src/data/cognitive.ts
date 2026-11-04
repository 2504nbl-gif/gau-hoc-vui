// Dữ liệu cho các trò Tư duy: nguyên liệu làm bánh/kem, quần áo cho gấu.

export interface Layer { id: string; name: string; color: string; emoji: string; h: number; w?: number; round?: boolean }

export const INGREDIENTS: Layer[] = [
  { id: 'bread', name: 'Bánh mì', color: '#e9b46a', emoji: '🍞', h: 3.4 },
  { id: 'lettuce', name: 'Rau xà lách', color: '#7cc35a', emoji: '🥬', h: 2 },
  { id: 'cheese', name: 'Phô mai', color: '#f6d34a', emoji: '🧀', h: 2 },
  { id: 'tomato', name: 'Cà chua', color: '#e8553f', emoji: '🍅', h: 2.2 },
  { id: 'ham', name: 'Thịt nguội', color: '#f19aa5', emoji: '🥓', h: 2.2 },
  { id: 'egg', name: 'Trứng', color: '#fff4cc', emoji: '🍳', h: 2.2 },
];
export const SCOOPS: Layer[] = [
  { id: 'strawberry', name: 'Kem dâu', color: '#f59ab5', emoji: '🍓', h: 5, round: true },
  { id: 'vanilla', name: 'Kem vani', color: '#fbeeb8', emoji: '🍦', h: 5, round: true },
  { id: 'chocolate', name: 'Kem sô cô la', color: '#8a5a3c', emoji: '🍫', h: 5, round: true },
  { id: 'mint', name: 'Kem bạc hà', color: '#9fe0c4', emoji: '🌿', h: 5, round: true },
  { id: 'cherry', name: 'Quả anh đào', color: '#d7263d', emoji: '🍒', h: 3, w: 30, round: true },
];


export type Slot = 'head' | 'body' | 'legs' | 'feet';
export interface Cloth { id: string; slot: Slot; emoji: string; name: string }

export const CLOTHES: Cloth[] = [
  { id: 'cap', slot: 'head', emoji: '🧢', name: 'Cái mũ' },
  { id: 'hat', slot: 'head', emoji: '👒', name: 'Cái nón' },
  { id: 'tshirt', slot: 'body', emoji: '👕', name: 'Cái áo' },
  { id: 'dress', slot: 'body', emoji: '👗', name: 'Cái váy' },
  { id: 'jeans', slot: 'legs', emoji: '👖', name: 'Cái quần dài' },
  { id: 'shorts', slot: 'legs', emoji: '🩳', name: 'Cái quần đùi' },
  { id: 'sneaker', slot: 'feet', emoji: '👟', name: 'Đôi giày' },
  { id: 'boot', slot: 'feet', emoji: '🥾', name: 'Đôi ủng' },
];

