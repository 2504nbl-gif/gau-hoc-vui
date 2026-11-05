import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect } from '@/services/audio/feedback';
import { noise, sfx, tone } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

/** Mỗi lượt: số đinh, số lần gõ cho một cái đinh lún hẳn. */
const LEVELS = [{ nails: 3, hits: 2 }, { nails: 4, hits: 3 }, { nails: 5, hits: 3 }];
const ROUNDS = LEVELS.length;
const INK = '#2b3a4f';
const NAIL_H = 38;

/** Tiếng "cốc" gỗ: nốt ngắn trượt xuống + tiếng tách của nhiễu lọc. */
function knock() {
  tone(880, 0.09, 'sine', 0.35, 0, 420);
  tone(190, 0.12, 'triangle', 0.18);
  noise(0.05, 0, 'bandpass', 2600, 1100, 0.3);
}

const star = (r: number, inner = 0): [number, number][] =>
  Array.from({ length: inner ? 10 : 5 }, (_, i) => {
    const a = (-90 + i * (inner ? 36 : 72)) * (Math.PI / 180);
    const rr = inner && i % 2 ? inner : r;
    return [200 + rr * Math.cos(a), 135 + rr * Math.sin(a)];
  });
const pts = (p: [number, number][]) => p.map((q) => q.join(',')).join(' ');
const S = { stroke: INK, strokeWidth: 5, strokeLinejoin: 'round' as const };

/** Hình hiện ra khi đóng hết đinh. Tên trùng nhãn chủ đề có sẵn (đã có giọng). Đinh nằm trên hình. */
const SHAPES: { name: string; nails: [number, number][]; art: ReactNode }[] = [
  { name: 'Ngôi nhà', nails: [[200, 75], [118, 212], [282, 212], [282, 150], [118, 150]], art: <>
    <rect x="80" y="118" width="240" height="122" rx="8" fill="#f2b23a" {...S} />
    <polygon points="200,28 352,124 48,124" fill="#ee7c5f" {...S} />
    <rect x="178" y="168" width="44" height="72" rx="6" fill="#8a5a35" {...S} />
    <rect x="232" y="146" width="48" height="42" rx="6" fill="#d6efff" {...S} />
  </> },
  { name: 'Thuyền buồm', nails: [[120, 196], [280, 196], [200, 214], [238, 140], [160, 140]], art: <>
    <rect x="195" y="28" width="10" height="148" fill="#8a5a35" {...S} />
    <polygon points="212,36 212,162 330,162" fill="#fff8e6" {...S} />
    <polygon points="188,62 188,162 96,162" fill="#f2b23a" {...S} />
    <path d="M36 172 H364 L312 238 H88 Z" fill="#4b9cef" {...S} />
  </> },
  { name: 'Ngôi sao', nails: star(76), art: <polygon points={pts(star(116, 48))} fill="#f2b23a" {...S} /> },
  { name: 'Con cá', nails: [[180, 132], [118, 166], [236, 96], [236, 166], [330, 132]], art: <>
    <polygon points="282,132 372,62 372,202" fill="#ee7c5f" {...S} />
    <ellipse cx="180" cy="132" rx="122" ry="78" fill="#f08a3c" {...S} />
    <circle cx="104" cy="114" r="12" fill="#fff" {...S} /><circle cx="101" cy="114" r="5" fill={INK} />
  </> },
];

function Nail({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx="11" ry="4" fill="#000" opacity=".25" />
      {h > 0 && <rect x={x - 4} y={y - h} width="8" height={h} fill="url(#nail-metal)" stroke={INK} strokeWidth="2" />}
      <ellipse cx={x} cy={y - h} rx="15" ry="6" fill="url(#nail-metal)" stroke={INK} strokeWidth="2.5" />
    </g>
  );
}

/** Búa: mặt gõ ở gốc tọa độ, cán nằm ngang sang phải; xoay quanh đuôi cán. */
function Hammer({ x, y, k }: { x: number; y: number; k: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.g key={k} initial={{ rotate: -40 }} animate={{ rotate: [-40, 0, -40] }}
        transition={{ duration: 0.36, times: [0, 0.4, 1], ease: 'easeIn' }} style={{ originX: 1, originY: 0.5 }}>
        <rect x="6" y="-28" width="118" height="13" rx="6" fill="#c98a4f" stroke={INK} strokeWidth="3" />
        <rect x="-18" y="-44" width="36" height="44" rx="6" fill="#8d99a8" stroke={INK} strokeWidth="3" />
        <rect x="-18" y="-44" width="36" height="9" rx="4" fill="#b7c1cc" />
      </motion.g>
    </g>
  );
}

/** Đóng đinh: chạm vào đinh, búa gõ xuống, đinh lún dần; đóng hết thì tấm gỗ thành hình. */
export function HammerNails({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'hammer-nails', rounds: ROUNDS });
  const lv = LEVELS[s.round];
  const order = useMemo(() => shuffle(SHAPES), [s.game]);
  const shape = order[s.round % order.length];
  const nails = shape.nails.slice(0, lv.nails);
  const [depth, setDepth] = useState<number[]>([]);
  const [swing, setSwing] = useState<{ i: number; k: number } | null>(null);
  const [built, setBuilt] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    setDepth(nails.map(() => 0)); setBuilt(false); setSwing(null); busy.current = false;
    preloadVoice([PHRASES.hammerHint, ...SHAPES.map((x) => x.name)], 'vi').then(() => say(PHRASES.hammerHint));
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps

  const hit = (i: number) => {
    if (busy.current || built || (depth[i] ?? 0) >= lv.hits) return;
    busy.current = true;
    setSwing({ i, k: Date.now() });
    setTimeout(() => {
      knock();
      const next = depth.map((d, j) => (j === i ? d + 1 : d));
      setDepth(next);
      if (next[i] === lv.hits) sfx.pop();
      setTimeout(async () => {
        busy.current = false;
        setSwing(null);
        if (next.every((d) => d >= lv.hits)) {
          setBuilt(true);
          await feedbackCorrect(shape.name).done;
          setTimeout(s.win, 700);
        }
      }, 230);
    }, 140);
  };

  const h = (i: number) => NAIL_H * (1 - (depth[i] ?? 0) / lv.hits);

  return (
    <GameScreen title="Đóng đinh" color="peach" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(built ? shape.name : PHRASES.hammerHint)}>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <svg viewBox="0 -40 400 300" className="h-[min(70vh,52vw)] touch-none overflow-visible" aria-label="Tấm gỗ">
          <defs>
            <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e3b47f" /><stop offset="1" stopColor="#c99a6b" />
            </linearGradient>
            <linearGradient id="nail-metal" x1="0" x2="1">
              <stop offset="0" stopColor="#7d8896" /><stop offset=".45" stopColor="#e6ebf0" /><stop offset="1" stopColor="#8d99a8" />
            </linearGradient>
          </defs>
          <motion.g initial={false} animate={{ opacity: built ? 0 : 1 }} transition={{ duration: 0.4 }}>
            <rect x="20" y="20" width="360" height="226" rx="22" fill="url(#wood)" stroke="#8a5a35" strokeWidth="6" />
            {[60, 105, 150, 200].map((y, i) => (
              <path key={y} d={`M40 ${y} q ${80 + i * 10} ${i % 2 ? 12 : -10} 160 0 t 160 0`} fill="none" stroke="#a77a4f" strokeWidth="3" opacity=".45" />
            ))}
          </motion.g>
          {built && (
            <motion.g initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }} style={{ originX: 0.5, originY: 0.5 }}>
              {shape.art}
            </motion.g>
          )}
          {nails.map(([x, y], i) => <Nail key={i} x={x} y={y} h={h(i)} />)}
          {nails.map(([x, y], i) => (
            <circle key={`t${i}`} data-nail={i} data-sunk={(depth[i] ?? 0) >= lv.hits ? 'yes' : undefined} cx={x} cy={y - 18} r="36"
              fill="transparent" className="cursor-pointer" onPointerDown={() => hit(i)} />
          ))}
          {swing && <Hammer x={nails[swing.i][0]} y={nails[swing.i][1] - h(swing.i)} k={swing.k} />}
        </svg>
      </div>
    </GameScreen>
  );
}
