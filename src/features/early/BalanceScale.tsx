import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Emoji } from '@/components/content/Emoji';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { burst } from '@/components/game/Fireworks';
import { WEIGHT_PAIRS } from '@/data/early';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say, sayAll } from '@/services/audio/voice';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

const ROUNDS = 5;
const TILT = 9; // độ nghiêng của đòn cân
const SIZE = 'min(27vh, 15vw)';
const SWING = { type: 'spring', stiffness: 60, damping: 7 } as const;
type Side = 'heavy' | 'light';
/** Vòng đầu hỏi "nặng hơn", sau thêm "nhẹ hơn"; từ vòng 4 hai vật vẽ bằng cỡ nhau nên bé phải nhìn cân. */
const ASKS: (Side | null)[] = ['heavy', 'heavy', 'light', null, null];

/** Cân thăng bằng (nặng/nhẹ): đặt hai vật lên cân bập bênh, cân nghiêng, bé chạm bên nặng hơn / nhẹ hơn. */
export function BalanceScale({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'balance-scale', rounds: ROUNDS });
  const deck = useMemo(() => shuffle(WEIGHT_PAIRS).slice(0, ROUNDS), [s.game]);
  const [heavy, light] = deck[s.round];
  const q = useMemo(() => ({
    heavyLeft: Math.random() < 0.5,
    ask: ASKS[s.round] ?? ((Math.random() < 0.5 ? 'heavy' : 'light') as Side),
  }), [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps
  const [tilted, setTilted] = useState(false);
  const [mark, setMark] = useState<{ side: Side; ok: boolean; k: number } | null>(null);
  const busy = useRef(false);
  const sameSize = s.round >= 3;

  const ask = () => say(q.ask === 'heavy' ? PHRASES.heavierAsk : PHRASES.lighterAsk);

  useEffect(() => {
    let off = false;
    busy.current = false;
    setTilted(false);
    setMark(null);
    const t = window.setTimeout(() => { if (!off) { setTilted(true); sfx.pop(); } }, 900);
    preloadVoice([PHRASES.heavierAsk, PHRASES.lighterAsk, PHRASES.heavier, PHRASES.lighter, PHRASES.correct, PHRASES.tryAgain,
      ...deck.flatMap(([a, b]) => [a.name, b.name])], 'vi').then(() => { if (!off) ask(); });
    return () => { off = true; window.clearTimeout(t); };
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = async (side: Side) => {
    if (busy.current) return;
    const thing = side === 'heavy' ? heavy : light;
    const word = side === 'heavy' ? PHRASES.heavier : PHRASES.lighter;
    if (side !== q.ask) { // "Con chuột · nhẹ hơn · Thử lại nhé!"
      s.miss();
      setMark({ side, ok: false, k: Date.now() });
      sfx.wrong();
      sayAll([thing.name, word, PHRASES.tryAgain]);
      return;
    }
    busy.current = true;
    setMark({ side, ok: true, k: Date.now() });
    sfx.correct();
    burst();
    await sayAll([PHRASES.correct, thing.name, word]).done; // "Đúng rồi! Con voi · nặng hơn"
    setTimeout(s.win, 300);
  };

  const angle = tilted ? (q.heavyLeft ? -TILT : TILT) : 0;
  const sides: Side[] = q.heavyLeft ? ['heavy', 'light'] : ['light', 'heavy'];

  return (
    <GameScreen title="Cân thăng bằng" color="grape" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => ask()}>
      <div className="relative mx-auto min-h-0 w-[min(88vw,170vh)] flex-1">
        {/* Chân cân */}
        <svg viewBox="0 0 100 60" className="absolute bottom-[3%] left-1/2 h-[24%] -translate-x-1/2" aria-hidden>
          <path d="M50 4 L84 54 H16 Z" fill="#8d71e8" stroke="#6f55c9" strokeWidth="3" strokeLinejoin="round" />
          <path d="M50 12 L60 28 H40 Z" fill="#b3a0f2" />
          <rect x="6" y="52" width="88" height="7" rx="3.5" fill="#6f55c9" />
        </svg>
        {/* Đòn cân: quay quanh tâm, hai vật đứng ở hai đầu và luôn thẳng đứng */}
        <motion.div className="absolute inset-x-[7%] bottom-[25%] h-[4.5%]" animate={{ rotate: angle }} transition={SWING}>
          <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
            <rect x="0" y="1" width="100" height="8" rx="4" fill="#b9774a" />
            <rect x="1" y="1.6" width="98" height="2.6" rx="1.3" fill="#d59a6b" />
          </svg>
          <span className="absolute left-1/2 top-1/2 size-[3.4vh] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.6vh] border-[#6f55c9] bg-sun" />
          {sides.map((side, i) => {
            const thing = side === 'heavy' ? heavy : light;
            const m = mark?.side === side ? mark : null;
            return (
              <motion.div key={`${s.game}-${s.round}-${side}`} className="absolute bottom-full"
                style={{ [i === 0 ? 'left' : 'right']: 0, originY: 1 }}
                initial={{ y: -40, opacity: 0, rotate: 0 }} animate={{ y: 0, opacity: 1, rotate: -angle }}
                transition={{ rotate: SWING, y: { type: 'spring', bounce: 0.5, delay: i * 0.15 }, opacity: { delay: i * 0.15 } }}>
                <motion.button key={m?.k ?? 0} aria-label={thing.name} data-side={side} onClick={() => pick(side)}
                  animate={m ? (m.ok ? { scale: [1, 1.12, 1] } : { x: [0, -12, 12, -8, 8, 0] }) : {}} transition={{ duration: 0.45 }}
                  whileTap={{ scale: 0.94 }}
                  className={`flex items-end justify-center rounded-[26px] border-4 leading-none ${m?.ok ? 'border-leaf bg-leaf/15' : 'border-transparent'}`}
                  style={{ width: `calc(${SIZE} * 1.15)`, height: `calc(${SIZE} * 1.1)` }}>
                  <Emoji glyph={thing.emoji} size={sameSize || side === 'heavy' ? SIZE : `calc(${SIZE} * .55)`} />
                </motion.button>
                {/* Đĩa cân */}
                <span className="block h-[1.8vh] rounded-b-full bg-[#d7ccf7] shadow-[0_3px_0_#b9a8ee]" />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </GameScreen>
  );
}
