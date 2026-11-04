import { NUMBER_WORDS, PHRASES } from '@/data/phrases';
import { useStreak } from '@/store/useDailyStore';
import { sayAll } from '@/services/audio/voice';
import { sfx } from '@/services/audio/sfx';

/** Mảnh câu "Con đã học · Ba · ngày liền!" (số lớn hơn 10 thì đọc liền bằng giọng máy). */
export const streakParts = (n: number): string[] =>
  n <= 10 ? [PHRASES.streakPre, NUMBER_WORDS[n], PHRASES.streakPost] : [`${PHRASES.streakPre} ${n} ${PHRASES.streakPost}`];

/** Ngọn lửa + số ngày học liền; chạm để nghe. Cùng kiểu với StarChip. */
export function StreakChip() {
  const n = useStreak();
  return (
    <button
      aria-label={`${n} ngày học liền`}
      onClick={() => { sfx.tap(); if (n > 0) sayAll(streakParts(n)); }}
      className="inline-flex h-11 items-center gap-1.5 rounded-full bg-paper px-4 font-extrabold tabular-nums shadow-[0_3px_0_var(--color-line)]"
    >
      <span className={n > 0 ? '' : 'opacity-40 grayscale'}>🔥</span> {n}
    </button>
  );
}
