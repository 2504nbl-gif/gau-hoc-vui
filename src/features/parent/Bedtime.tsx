import { useEffect } from 'react';
import { motion } from 'motion/react';
import { BearMascot } from '@/components/content/BearMascot';
import { PHRASES } from '@/data/phrases';
import { say, stopVoice } from '@/services/audio/voice';
import { ParentGate } from './ParentGate';

/** Hết giờ chơi trong ngày: Gấu đi ngủ, cô nói nhẹ nhàng. Chỉ bố mẹ (qua ổ khóa) mới mở lại được. */
export function Bedtime() {
  useEffect(() => {
    const t = window.setTimeout(() => say(PHRASES.bedtime), 500);
    return () => { window.clearTimeout(t); stopVoice(); };
  }, []);

  return (
    <div
      role="dialog"
      aria-label="Gấu đi ngủ rồi"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 overflow-hidden bg-[linear-gradient(#22305a,#3d4f86)] p-6 text-center text-white"
    >
      {[[12, 18], [80, 12], [64, 30], [24, 40], [90, 46], [8, 70], [72, 76]].map(([x, y], i) => (
        <span key={i} aria-hidden className="absolute text-xl opacity-80 [animation:bob_3s_ease-in-out_infinite]" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.4}s` }}>✦</span>
      ))}
      <span aria-hidden className="absolute top-[8%] right-[14%] text-6xl">🌙</span>
      <button aria-label="Nghe lại" onClick={() => say(PHRASES.bedtime)} className="relative w-[clamp(130px,20vw,200px)]">
        <BearMascot className="block w-full" />
        {/* mắt nhắm */}
        <svg viewBox="0 0 120 120" className="absolute inset-0" aria-hidden>
          <circle cx="43" cy="58" r="8" fill="#b9774a" />
          <circle cx="77" cy="58" r="8" fill="#b9774a" />
          <path d="M36 58 Q43 64 50 58 M70 58 Q77 64 84 58" stroke="#2d2420" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
        {['z', 'z', 'Z'].map((z, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute -top-2 right-0 font-display text-3xl font-extrabold"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], x: 30 + i * 12, y: -40 - i * 18 }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8 }}
          >
            {z}
          </motion.span>
        ))}
      </button>
      <h1 className="m-0 font-display text-[clamp(34px,6vw,60px)] font-extrabold">Gấu đi ngủ rồi</h1>
      <p className="m-0 max-w-[32ch] text-lg font-bold opacity-85">Hôm nay chơi đủ rồi, mai mình chơi tiếp nhé!</p>
      <ParentGate />
    </div>
  );
}
