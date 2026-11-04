import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DancingBear } from './DancingBear';
import { BEAT_S, playDanceTune } from '@/services/audio/danceTune';
import { say } from '@/services/audio/voice';
import { PHRASES } from '@/data/phrases';

const CONFETTI = ['🎉', '⭐', '🎈', '✨', '🎵', '💛', '🎶', '🌟'];

/** Màn chúc mừng phủ toàn màn hình: Gấu nhảy theo nhạc ~7 giây. Chạm để đóng sớm. */
export function Celebration({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    say(PHRASES.dance, 'vi');
    let t = 0;
    const stop = playDanceTune(() => { t = window.setTimeout(onClose, 500); });
    return () => { stop(); window.clearTimeout(t); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="Gấu nhảy múa"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center overflow-hidden"
          style={{ background: 'radial-gradient(circle at 50% 60%, #fff6d8 0 30%, color-mix(in srgb, var(--color-sun) 55%, white) 70%)' }}
        >
          {CONFETTI.flatMap((c) => [c, c]).map((c, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="pointer-events-none absolute top-0 text-[clamp(26px,4vw,44px)]"
              style={{ left: `${(i * 6.1 + 3) % 96}%` }}
              initial={{ y: '-10vh', rotate: 0 }}
              animate={{ y: '110vh', rotate: i % 2 ? 360 : -360 }}
              transition={{ duration: 3 + (i % 5) * 0.5, delay: (i % 7) * 0.35, repeat: Infinity, ease: 'linear' }}
            >
              {c}
            </motion.span>
          ))}
          <motion.div initial={{ scale: 0.3, y: 80 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="flex flex-col items-center">
            <DancingBear beat={BEAT_S * 2} className="h-[min(62vh,420px)] w-auto drop-shadow-[0_10px_0_rgba(0,0,0,.08)]" />
            <b className="mt-2 font-display text-[clamp(28px,5vw,52px)] font-extrabold text-leaf [text-shadow:0_3px_0_#fff]">{PHRASES.dance}</b>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
