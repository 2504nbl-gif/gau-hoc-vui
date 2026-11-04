import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DayLog, ProgressState } from '@/types/progress';
import { useRewardStore } from './useRewardStore';

/** Khóa ngày theo giờ máy, vd "2026-11-04". */
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const KEEP_DAYS = 60;

function bumpDay(daily: Record<string, DayLog>, patch: Partial<DayLog>): Record<string, DayLog> {
  const k = dayKey();
  const cur = daily[k] ?? { plays: 0, seconds: 0, stars: 0 };
  const next = { ...daily, [k]: { plays: cur.plays + (patch.plays ?? 0), seconds: cur.seconds + (patch.seconds ?? 0), stars: cur.stars + (patch.stars ?? 0) } };
  const keys = Object.keys(next).sort();
  keys.slice(0, Math.max(0, keys.length - KEEP_DAYS)).forEach((old) => delete next[old]);
  return next;
}

interface ProgressStore extends ProgressState {
  /** Cộng sao khi xong một bài. `reward` = mức thưởng (mặc định = số sao): ≥2 được sticker, 3 thì Gấu nhảy. */
  addStars: (n: number, reward?: number) => void;
  recordFlashcards: (topicIds: string[]) => void;
  setChildName: (name: string) => void;
  /**
   * Lưu số sao của một bài, chỉ giữ kết quả cao nhất.
   * `stats` = số lượt đúng ngay lần đầu / tổng lượt, để Góc phụ huynh tính tỉ lệ đúng.
   */
  recordGame: (id: string, stars: 1 | 2 | 3, stats?: { correct: number; total: number }) => void;
  /** Cộng thời gian đang chơi trong ngày (giây). */
  addPlayTime: (seconds: number) => void;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set) => ({
      childName: 'Gấu',
      stars: 0,
      flashcardViews: {},
      gameResults: {},
      daily: {},
      gameStats: {},
      // Mỗi bài hoàn thành đều được cộng sao → đếm "lượt học" ở đây là đủ cho mọi loại bài.
      addStars: (n, reward = n) => {
        set((s) => ({ stars: s.stars + n, daily: bumpDay(s.daily, { plays: 1, stars: n }) }));
        useRewardStore.getState().earn(reward);
      },
      addPlayTime: (seconds) => set((s) => ({ daily: bumpDay(s.daily, { seconds }) })),
      recordFlashcards: (ids) =>
        set((s) => {
          const views = { ...s.flashcardViews };
          ids.forEach((id) => { views[id] = (views[id] ?? 0) + 1; });
          return { flashcardViews: views, lastModule: 'flashcards' };
        }),
      setChildName: (childName) => set({ childName }),
      recordGame: (id, stars, stats) =>
        set((s) => {
          const g = s.gameStats[id] ?? { plays: 0, correct: 0, total: 0 };
          return {
            gameResults: { ...s.gameResults, [id]: Math.max(stars, s.gameResults[id] ?? 0) as 1 | 2 | 3 },
            gameStats: { ...s.gameStats, [id]: { plays: g.plays + 1, correct: g.correct + (stats?.correct ?? 0), total: g.total + (stats?.total ?? 0) } },
          };
        }),
    }),
    { name: 'gau-progress', version: 1 },
  ),
);
