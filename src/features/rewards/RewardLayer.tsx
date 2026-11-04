import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useRewardStore } from '@/store/useRewardStore';
import { stickerById } from '@/data/stickers';
import { Celebration } from '@/components/content/Celebration';
import { PHRASES } from '@/data/phrases';
import { sayAll } from '@/services/audio/voice';
import { NOTE_HZ, tone } from '@/services/audio/sfx';

/** "Lấp lánh" khi sticker bay vào: chuỗi nốt đi lên. */
const sparkle = () => (['C4', 'E4', 'G4', 'C5', 'E4', 'G4'] as const).forEach((n, i) =>
  tone(NOTE_HZ[n] * (i < 4 ? 2 : 4), 0.3, 'sine', 0.14, i * 0.07));

/** Lớp trên cùng của app: hiện lần lượt phần thưởng đang chờ (sticker mới, Gấu nhảy múa). */
export function RewardLayer() {
  const head = useRewardStore((s) => s.queue[0]);
  const next = useRewardStore((s) => s.next);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setShown(false);
    if (!head) return;
    const t = window.setTimeout(() => setShown(true), head.delay);
    return () => window.clearTimeout(t);
  }, [head]);

  const sticker = shown && head?.kind === 'sticker' ? stickerById(head.id) : undefined;

  useEffect(() => {
    if (!sticker) return;
    sparkle();
    const t0 = window.setTimeout(() => sayAll([PHRASES.newSticker, sticker.name]), 500);
    const t1 = window.setTimeout(next, 4200);
    return () => { window.clearTimeout(t0); window.clearTimeout(t1); };
  }, [sticker]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <AnimatePresence>
        {sticker && (
          <motion.div
            key={sticker.id}
            role="dialog"
            aria-label={PHRASES.newSticker}
            onClick={next}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4"
          >
            <div className="flex flex-col items-center gap-8 text-center">
              <div className="relative grid place-items-center">
                <motion.span aria-hidden className="absolute size-[min(52vh,320px)] rounded-full"
                  style={{ background: 'repeating-conic-gradient(#ffe48a 0 12deg, #fff6c9 12deg 24deg)' }}
                  initial={{ scale: 0 }} animate={{ scale: 1, rotate: 180 }} transition={{ scale: { duration: 0.5 }, rotate: { duration: 5, ease: 'linear' } }} />
                <motion.span
                  className="relative text-[min(30vh,180px)] leading-none [filter:drop-shadow(0_0_0_#fff)_drop-shadow(4px_0_0_#fff)_drop-shadow(-4px_0_0_#fff)_drop-shadow(0_4px_0_#fff)_drop-shadow(0_-4px_0_#fff)_drop-shadow(0_8px_6px_rgba(0,0,0,.25))]"
                  initial={{ x: '60vw', y: '-50vh', scale: 0.2, rotate: -540 }}
                  animate={{ x: 0, y: 0, scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 90, damping: 13 }}
                >
                  {sticker.emoji}
                </motion.span>
              </div>
              <motion.b initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                className="relative z-10 rounded-full bg-paper px-6 py-2 font-display text-[clamp(24px,4vw,40px)] font-extrabold text-grape">
                {PHRASES.newSticker} {sticker.name}
              </motion.b>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Celebration open={shown && head?.kind === 'dance'} onClose={next} />
    </>
  );
}
