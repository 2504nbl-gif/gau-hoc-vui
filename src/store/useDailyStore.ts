import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, buildPlan, dayKey, stepInfo, type PlanStep } from '@/features/daily/plan';
import { useProgressStore } from './useProgressStore';
import { useNav, type Route } from './useNav';

/** Lộ trình của ngày đang học. */
export interface DailyPlan {
  day: string;
  steps: PlanStep[];
  /** done[i] = chặng i đã xong. */
  done: boolean[];
}

/** Nhật ký một ngày (cho góc phụ huynh). */
export interface DayLog {
  day: string;
  /** Số chặng trong lộ trình hôm đó. */
  total: number;
  /** Số chặng bé đã xong. */
  done: number;
  /** Xong cả lộ trình. */
  completed: boolean;
  steps: PlanStep[];
}

const HISTORY_DAYS = 120;

interface DailyStore {
  plan: DailyPlan | null;
  /** Chặng đang mở từ đường đi (không lưu). */
  active: number | null;
  /** Số ngày học xong liên tiếp tính tới lastDoneDay (đọc qua currentStreak để biết chuỗi còn giữ không). */
  streak: number;
  bestStreak: number;
  /** Ngày gần nhất xong cả lộ trình (dayKey). */
  lastDoneDay: string | null;
  /** Ngày đã phát lời chúc mừng (để không chúc lại mỗi lần mở). */
  celebratedDay: string | null;
  /** Nhật ký các ngày đã mở lộ trình, cũ → mới, giữ tối đa 120 ngày. */
  history: DayLog[];

  /** Tạo lộ trình hôm nay nếu chưa có; trả về lộ trình. */
  ensureToday: () => DailyPlan;
  /** Bé chạm trạm i: ghi nhớ chặng đang làm, trả về route để mở. */
  start: (i: number) => Route | undefined;
  /** Chặng đang mở đã xong (tự gọi khi bé được cộng sao trong hoạt động mở từ đường đi). */
  completeActive: () => void;
  /** Về lại đường đi: bỏ chặng đang mở. */
  clearActive: () => void;
  markCelebrated: (day: string) => void;
}

const upsertLog = (history: DayLog[], log: DayLog) =>
  [...history.filter((h) => h.day !== log.day), log].sort((a, b) => a.day.localeCompare(b.day)).slice(-HISTORY_DAYS);

const logOf = (p: DailyPlan): DayLog => {
  const done = p.done.filter(Boolean).length;
  return { day: p.day, total: p.steps.length, done, completed: done === p.steps.length, steps: p.steps };
};

export const useDailyStore = create<DailyStore>()(
  persist(
    (set, get) => ({
      plan: null,
      active: null,
      streak: 0,
      bestStreak: 0,
      lastDoneDay: null,
      celebratedDay: null,
      history: [],

      ensureToday: () => {
        const today = dayKey();
        const cur = get().plan;
        if (cur?.day === today && cur.steps.every((s) => stepInfo(s))) return cur;
        const { flashcardViews, gameResults } = useProgressStore.getState();
        const recent = get().history.filter((h) => h.day < today).reverse().map((h) => h.steps);
        const steps = buildPlan(today, { flashcardViews, gameResults, recent });
        const plan: DailyPlan = { day: today, steps, done: steps.map(() => false) };
        set((s) => ({ plan, active: null, history: upsertLog(s.history, logOf(plan)) }));
        return plan;
      },

      start: (i) => {
        const step = get().plan?.steps[i];
        const info = step && stepInfo(step);
        if (!info) return undefined;
        set({ active: i });
        return info.route;
      },

      completeActive: () => {
        const { plan, active } = get();
        if (!plan || active === null || plan.done[active]) return;
        if (!useNav.getState().route.fromDaily) return;
        const next: DailyPlan = { ...plan, done: plan.done.map((d, i) => d || i === active) };
        const log = logOf(next);
        set((s) => {
          const patch: Partial<DailyStore> = { plan: next, history: upsertLog(s.history, log) };
          if (log.completed && s.lastDoneDay !== plan.day) {
            const streak = s.lastDoneDay === addDays(plan.day, -1) ? s.streak + 1 : 1;
            Object.assign(patch, { streak, bestStreak: Math.max(s.bestStreak, streak), lastDoneDay: plan.day });
          }
          return patch;
        });
      },

      clearActive: () => set({ active: null }),
      markCelebrated: (day) => set({ celebratedDay: day }),
    }),
    {
      name: 'gau-daily',
      version: 1,
      partialize: ({ plan, streak, bestStreak, lastDoneDay, celebratedDay, history }) =>
        ({ plan, streak, bestStreak, lastDoneDay, celebratedDay, history }),
    },
  ),
);

/** Chuỗi ngày học liền đang giữ: 0 nếu đã lỡ một ngày (hôm qua lẫn hôm nay đều chưa xong). */
export function currentStreak(s: Pick<DailyStore, 'streak' | 'lastDoneDay'>, today = dayKey()): number {
  return s.lastDoneDay === today || s.lastDoneDay === addDays(today, -1) ? s.streak : 0;
}

/** Hook tiện dùng: số ngày học liền hiện tại. */
export const useStreak = () => useDailyStore((s) => currentStreak(s));

// Hoạt động mở từ đường đi coi là "xong" khi bé được cộng sao: mọi trò, tráo thẻ, thơ truyện
// đều chỉ cộng sao lúc kết thúc bài, nên không phải sửa từng trò.
useProgressStore.subscribe((s, prev) => {
  if (s.stars > prev.stars) useDailyStore.getState().completeActive();
});
