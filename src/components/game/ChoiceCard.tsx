import { motion } from 'motion/react';
import type { Visual } from '@/types/content';
import { CardVisual } from '@/components/content/CardVisual';

export type ChoiceState = 'idle' | 'right' | 'wrong' | 'dim';

/** Thẻ đáp án to, dễ chạm. Dùng chung cho kính lúp, Nghe & Tìm và các trò sau. */
export function ChoiceCard({
  visual, label, state = 'idle', onPick, size = 'min(17vh, 12vw)', shakeKey = 0,
}: {
  visual: Visual;
  label?: string;
  state?: ChoiceState;
  onPick: () => void;
  size?: string;
  /** Tăng số này để lắc thẻ khi chọn sai. */
  shakeKey?: number;
}) {
  return (
    <motion.button
      key={shakeKey}
      onClick={onPick}
      aria-label={label}
      initial={false}
      animate={
        state === 'wrong' ? { x: [0, -12, 12, -8, 8, 0] }
        : state === 'right' ? { scale: [1, 1.12, 1] }
        : { x: 0, scale: 1 }
      }
      transition={{ duration: 0.45 }}
      whileTap={{ scale: 0.94 }}
      className={`flex min-h-0 min-w-0 flex-col items-center justify-center gap-1 rounded-[26px] border-4 bg-paper p-3 shadow-[0_6px_0_var(--color-line)] transition-[opacity,border-color] ${
        state === 'right' ? 'border-leaf bg-leaf/10' : state === 'wrong' ? 'border-berry/60' : 'border-transparent'
      } ${state === 'dim' ? 'opacity-35' : ''}`}
    >
      <CardVisual visual={visual} size={size} />
      {label && <span className="font-display text-lg font-extrabold text-ink">{label}</span>}
    </motion.button>
  );
}
