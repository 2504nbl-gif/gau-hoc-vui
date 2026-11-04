// Sổ sticker: 40 sticker emoji chia 4 trang theo chủ đề.
// Tên đọc lấy lại từ nhãn của chủ đề có cùng emoji (khỏi khai báo 2 lần, gói giọng đã có sẵn).
import { TOPICS } from './index';
import { PHRASES } from './phrases';

export interface Sticker { id: string; emoji: string; name: string }
export interface StickerPage { title: string; icon: string; color: string; stickers: Sticker[] }

const LABELS = new Map<string, string>();
for (const t of TOPICS) {
  for (const i of t.items) if (i.visual.kind === 'emoji' && !LABELS.has(i.visual.value)) LABELS.set(i.visual.value, i.label.vi);
}

/** "🐶 🐱 …" — emoji không có trong chủ đề nào thì ghi kèm tên: "🦄|Kỳ lân". */
const page = (i: number, icon: string, color: string, spec: string): StickerPage => ({
  title: PHRASES.stickerPages[i], icon, color,
  stickers: spec.split(/\s+/).filter(Boolean).map((s) => {
    const [emoji, name] = s.split('|');
    return { id: emoji, emoji, name: name ?? LABELS.get(emoji) ?? emoji };
  }),
});

export const STICKER_PAGES: StickerPage[] = [
  page(0, '🐶', 'leaf', '🐶 🐱 🐇 🐻 🐼 🐨 🦁 🐯 🐸 🐧'),
  page(1, '🚗', 'sea', '🚗 🚌 🚒 🚓 🚑 ✈️ 🚁 🚢 🚜 🚂'),
  page(2, '🍓', 'berry', '🍎 🍌 🍓 🍉 🍇 🍦 🍰 🍪 🍩 🍭'),
  page(3, '🚀', 'grape', '🚀 🌍 🌙 ⭐ ☀️ 🪐 🧑‍🚀 ☄️ 🛸 🛰️'),
];

export const STICKERS: Sticker[] = STICKER_PAGES.flatMap((p) => p.stickers);
export const stickerById = (id: string) => STICKERS.find((s) => s.id === id);
