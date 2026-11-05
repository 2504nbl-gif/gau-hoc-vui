import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Emoji } from '@/components/content/Emoji';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

/** Mỗi lượt: số cốc, số lần đổi chỗ, thời gian một lần đổi (ms). Vòng sau nhanh dần, 2 cốc → 3 cốc. */
const LEVELS = [
  { cups: 2, swaps: 2, ms: 1100 },
  { cups: 2, swaps: 3, ms: 850 },
  { cups: 3, swaps: 3, ms: 1000 },
  { cups: 3, swaps: 4, ms: 750 },
];
const ROUNDS = LEVELS.length;
/** Tên trùng nhãn chủ đề có sẵn để dùng lại giọng đã thu. */
const TOYS = [
  { emoji: '🧸', name: 'Gấu bông' }, { emoji: '⚽', name: 'Quả bóng' }, { emoji: '🐥', name: 'Gà con' },
  { emoji: '🚗', name: 'Xe ô tô' }, { emoji: '🦆', name: 'Con vịt' },
];
const CUP = 'min(24vh, 15vw)';
type Phase = 'show' | 'shuffle' | 'pick' | 'done';

function Cup() {
  return (
    <svg viewBox="0 0 100 110" style={{ width: CUP, height: `calc(${CUP} * 1.1)` }} aria-hidden>
      <defs>
        <linearGradient id="cup-body" x1="0" x2="1">
          <stop offset="0" stopColor="#c43c62" /><stop offset=".35" stopColor="#f07396" /><stop offset="1" stopColor="#b8335a" />
        </linearGradient>
      </defs>
      <path d="M14 98 L26 12 Q27 6 34 6 H66 Q73 6 74 12 L86 98 Z" fill="url(#cup-body)" stroke="#2b3a4f" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M33 16 L25 86" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".45" />
      <rect x="8" y="94" width="84" height="12" rx="6" fill="#d94a70" stroke="#2b3a4f" strokeWidth="3.5" />
      <circle cx="50" cy="44" r="9" fill="#fff" opacity=".85" />
    </svg>
  );
}

/** Úp cốc: đồ chơi chui vào một cốc, các cốc đổi chỗ, bé chạm cốc có đồ chơi. */
export function CupShuffle({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'cup-shuffle', rounds: ROUNDS });
  const lv = LEVELS[s.round];
  const [toy, setToy] = useState(TOYS[0]);
  const [slots, setSlots] = useState<number[]>([0, 1]);
  const [toyCup, setToyCup] = useState(0);
  const [lifted, setLifted] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('show');
  const run = useRef(0);

  useEffect(() => {
    const id = ++run.current;
    const alive = () => run.current === id;
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const t = TOYS[Math.floor(Math.random() * TOYS.length)];
    const cupIds = Array.from({ length: lv.cups }, (_, i) => i);
    const hideIn = Math.floor(Math.random() * lv.cups);
    setToy(t); setToyCup(hideIn); setSlots(cupIds); setLifted([hideIn]); setPhase('show');
    (async () => {
      await preloadVoice([PHRASES.cupWatch, PHRASES.cupFind, t.name], 'vi');
      if (!alive()) return;
      // Cho bé nhìn đồ chơi ít nhất 2,5 giây (kể cả khi câu nói ngắn hoặc không có giọng).
      await Promise.all([say(PHRASES.cupWatch).done.then(() => wait(500)), wait(2500)]);
      if (!alive()) return;
      setLifted([]); sfx.pop();
      await wait(900);
      setPhase('shuffle');
      let cur = cupIds;
      for (let i = 0; i < lv.swaps; i++) {
        if (!alive()) return;
        const [a, b] = shuffle(cupIds).slice(0, 2);
        cur = cur.map((slot, cup) => (cup === a ? cur[b] : cup === b ? cur[a] : slot));
        setSlots(cur); sfx.flip();
        await wait(lv.ms + 150);
      }
      if (!alive()) return;
      setPhase('pick');
      say(PHRASES.cupFind);
    })();
    return () => { run.current++; };
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = async (cup: number) => {
    if (phase !== 'pick' || lifted.includes(cup)) return;
    setLifted((l) => [...l, cup]);
    if (cup === toyCup) {
      setPhase('done');
      await feedbackCorrect(toy.name).done;
      setTimeout(s.win, 400);
      return;
    }
    s.miss();
    feedbackWrong();
    setTimeout(() => setLifted((l) => l.filter((c) => c !== cup)), 1100);
  };

  return (
    <GameScreen title="Úp cốc" color="grape" session={s} rounds={ROUNDS} onExit={onExit}
      onReplay={() => say(phase === 'pick' ? PHRASES.cupFind : PHRASES.cupWatch)}>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="relative h-[48vh] w-[min(80vw,120vh)]">
          <div className="absolute inset-x-0 bottom-0 h-[22%] rounded-[40px] bg-[#c99a6b] shadow-[0_8px_0_#a77a4f]" />
          {slots.map((slot, cup) => (
            <motion.button key={cup} data-cup={cup} data-toy={cup === toyCup ? 'yes' : undefined}
              aria-label={`Cốc ${cup + 1}`} onClick={() => tap(cup)}
              className="absolute bottom-[10%] flex -translate-x-1/2 flex-col items-center"
              initial={false} animate={{ left: `${((slot + 0.5) / slots.length) * 100}%` }}
              transition={{ duration: phase === 'shuffle' ? lv.ms / 1000 : 0, ease: 'easeInOut' }}>
              <div className="relative grid place-items-end">
                {cup === toyCup && (
                  <span className="absolute bottom-[4%] left-1/2 -translate-x-1/2"><Emoji glyph={toy.emoji} size={`calc(${CUP} * .62)`} /></span>
                )}
                <motion.div className="relative" initial={false}
                  animate={{ y: lifted.includes(cup) ? '-78%' : '0%', rotate: lifted.includes(cup) ? -6 : 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                  <Cup />
                </motion.div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </GameScreen>
  );
}
