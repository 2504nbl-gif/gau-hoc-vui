import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STICKERS } from '@/data/stickers';

/** Phần thưởng chờ hiện lần lượt: sticker mới bay vào, rồi Gấu nhảy múa. */
export type Reward = { kind: 'sticker'; id: string; delay: number } | { kind: 'dance'; delay: number };

/** Chờ lời khen "Giỏi quá!" đọc xong rồi mới hiện phần thưởng. */
const AFTER_PRAISE_MS = 2600;

interface RewardStore {
  /** Id các sticker bé đã có (lưu lại). */
  stickers: string[];
  queue: Reward[];
  /** Gọi khi xong một bài: ≥2 sao được 1 sticker ngẫu nhiên chưa có, 3 sao thì Gấu nhảy múa. */
  earn: (stars: number) => void;
  /** Xem Gấu nhảy ngay (chạm gấu ở trang chủ). */
  dance: () => void;
  /** Phần thưởng đang hiện đã xong. */
  next: () => void;
}

export const useRewardStore = create<RewardStore>()(
  persist(
    (set) => ({
      stickers: [],
      queue: [],
      earn: (stars) =>
        set((s) => {
          const add: Reward[] = [];
          const left = STICKERS.filter((x) => !s.stickers.includes(x.id));
          const pick = stars >= 2 && left.length ? left[Math.floor(Math.random() * left.length)] : null;
          if (pick) add.push({ kind: 'sticker', id: pick.id, delay: AFTER_PRAISE_MS });
          if (stars >= 3) add.push({ kind: 'dance', delay: add.length ? 300 : AFTER_PRAISE_MS });
          if (!add.length) return s;
          return { stickers: pick ? [...s.stickers, pick.id] : s.stickers, queue: [...s.queue, ...add] };
        }),
      dance: () => set((s) => (s.queue.length ? s : { queue: [{ kind: 'dance', delay: 0 }] })),
      next: () => set((s) => ({ queue: s.queue.slice(1) })),
    }),
    { name: 'gau-rewards', version: 1, partialize: (s) => ({ stickers: s.stickers }) },
  ),
);
