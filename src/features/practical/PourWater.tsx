import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { POUR_LEVELS } from '@/data/practical';
import { PHRASES } from '@/data/phrases';
import { preloadVoice, say, sayAll } from '@/services/audio/voice';
import { feedbackCorrect } from '@/services/audio/feedback';
import { noise, sfx, tone } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

const ROUNDS = POUR_LEVELS.length;
const INK = '#2b3a4f';
/** Giây để rót từ cốc rỗng tới miệng cốc. */
const FILL_SEC = 5;
/** Sai số quanh vạch (tỉ lệ chiều cao cốc). */
const TOL = 0.09;
/** Quá mức này là nước tràn ra ngoài. */
const SPILL = 1.03;
// Lòng cốc trong hệ tọa độ SVG.
const CUP = { x: 262, w: 116, bottom: 442, h: 160 };

type Phase = 'play' | 'spill' | 'won';

/** Rót nước: chạm giữ bình cho nước chảy vào cốc, thả tay khi nước tới vạch. Rót quá thì tràn, làm lại. */
export function PourWater({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'pour-water', rounds: ROUNDS });
  const lv = POUR_LEVELS[s.round];
  const lo = lv.target - TOL;
  const hi = lv.id === 'full' ? 1 : lv.target + TOL;
  const [level, setLevel] = useState(0);
  const [pouring, setPouring] = useState(false);
  const [phase, setPhase] = useState<Phase>('play');
  const st = useRef({ level: 0, raf: 0, last: 0, downAt: 0, inBand: false, sound: 0, phase: 'play' as Phase });
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const stopLoop = () => { cancelAnimationFrame(st.current.raf); st.current.raf = 0; setPouring(false); };
  const setP = (p: Phase) => { st.current.phase = p; setPhase(p); };
  const ask = () => sayAll([PHRASES.pourHint, lv.ask]);

  useEffect(() => {
    st.current.level = 0; st.current.inBand = false; setLevel(0); setP('play');
    preloadVoice([PHRASES.pourHint, PHRASES.pourMore, PHRASES.pourOver, PHRASES.pourSpill, 'Cái cốc', 'Bình nước', ...POUR_LEVELS.map((l) => l.ask)], 'vi')
      .then(() => (s.round === 0 ? ask() : say(lv.ask)));
    return () => { stopLoop(); timers.current.forEach(clearTimeout); timers.current = []; };
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Đổ nước đi rồi cho bé rót lại. */
  const retry = (phrase: string, wait: number) => {
    stopLoop(); setP('spill'); s.miss(); sfx.wrong(); say(phrase);
    later(() => { st.current.level = 0; st.current.inBand = false; setLevel(0); setP('play'); }, wait);
  };

  const tick = (t: number) => {
    const c = st.current;
    const dt = Math.min(0.05, (t - c.last) / 1000);
    c.last = t;
    c.level += dt / FILL_SEC;
    if (t - c.sound > 180) { c.sound = t; noise(0.2, 0, 'bandpass', 700 + c.level * 900, 1100 + c.level * 900, 0.05); }
    if (!c.inBand && c.level >= lo) { c.inBand = true; tone(1568, 0.25, 'sine', 0.14); }
    setLevel(c.level);
    if (c.level >= SPILL) { retry(PHRASES.pourSpill, 2400); return; }
    c.raf = requestAnimationFrame(tick);
  };

  const down = (e: React.PointerEvent) => {
    if (st.current.phase !== 'play' || st.current.raf) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sự kiện giả lập */ }
    st.current.downAt = st.current.last = performance.now();
    setPouring(true);
    st.current.raf = requestAnimationFrame(tick);
  };

  const up = () => {
    const c = st.current;
    if (!c.raf || c.phase !== 'play') return;
    stopLoop();
    if (performance.now() - c.downAt < 220) { say('Bình nước'); return; } // chạm nhẹ: đọc tên
    if (c.level > hi) { retry(PHRASES.pourOver, 2200); return; }
    if (c.level < lo) { say(PHRASES.pourMore); return; }
    setP('won');
    feedbackCorrect().done.then(() => later(s.win, 500));
  };

  const shown = Math.min(level, 1);
  const waterY = CUP.bottom - shown * CUP.h;
  const lineY = CUP.bottom - lv.target * CUP.h;
  const good = level >= lo && level <= hi;
  const spilled = phase === 'spill' && level >= 1;

  return (
    <GameScreen title="Rót nước" color="sky" session={s} rounds={ROUNDS} onExit={onExit} onReplay={ask}>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <svg viewBox="0 0 640 470" className="h-full max-h-[min(78vh,56vw)] w-full touch-none overflow-visible" aria-label="Rót nước"
          data-level={level.toFixed(2)} data-phase={phase} data-lo={lo.toFixed(2)} data-hi={hi.toFixed(2)}>
          {/* Mặt bàn */}
          <rect x="40" y="446" width="560" height="20" rx="10" fill="#c99a6b" stroke="#8a5a35" strokeWidth="4" />
          {/* Nước tràn ra bàn */}
          <motion.ellipse cx="320" cy="448" ry="9" fill="#7cc8f5" initial={false} animate={{ rx: spilled ? 150 : 0, opacity: spilled ? 0.9 : 0 }} />
          {spilled && [CUP.x - 6, CUP.x + CUP.w + 6].map((x) => (
            <motion.rect key={x} x={x - 5} y={CUP.bottom - CUP.h - 6} width="10" rx="5" fill="#7cc8f5"
              initial={{ height: 0 }} animate={{ height: CUP.h + 10 }} transition={{ duration: 0.5 }} />
          ))}

          {/* Dòng nước từ vòi bình xuống mặt nước */}
          {pouring && <rect x="313" y="136" width="13" height={Math.max(0, waterY - 136)} rx="6" fill="#7cc8f5" opacity=".9" />}

          {/* Cốc thủy tinh: chạm → đọc tên */}
          <g onClick={() => say('Cái cốc')} className="cursor-pointer" aria-label="Cái cốc">
            <rect x={CUP.x} y={CUP.bottom - CUP.h - 14} width={CUP.w} height={CUP.h + 14} rx="6" fill="#ffffff" opacity=".55" />
            <motion.rect x={CUP.x} width={CUP.w} rx="6" fill="#4bb4f0" initial={false}
              animate={{ y: waterY, height: shown * CUP.h }} transition={{ duration: phase === 'spill' && level === 0 ? 0.5 : 0 }} />
            {shown > 0.02 && <rect x={CUP.x} y={waterY} width={CUP.w} height="7" rx="3" fill="#a6dcfb" />}
            <path d={`M${CUP.x - 4} ${CUP.bottom - CUP.h - 16} V${CUP.bottom - 6} q0 12 12 12 H${CUP.x + CUP.w - 8} q12 0 12 -12 V${CUP.bottom - CUP.h - 16}`}
              fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <rect x={CUP.x + 12} y={CUP.bottom - CUP.h + 4} width="9" height={CUP.h - 30} rx="4" fill="#fff" opacity=".7" />
          </g>

          {/* Vạch đích: đỏ cam → xanh lá khi nước tới nơi */}
          <g pointerEvents="none" data-good={good ? 'yes' : undefined}>
            <line x1={CUP.x - 22} x2={CUP.x + CUP.w + 22} y1={lineY} y2={lineY} stroke={good ? '#4db463' : '#ee7c5f'} strokeWidth="7" strokeDasharray="14 9" strokeLinecap="round" />
            <motion.polygon points={`${CUP.x + CUP.w + 62},${lineY - 17} ${CUP.x + CUP.w + 62},${lineY + 17} ${CUP.x + CUP.w + 30},${lineY}`}
              fill={good ? '#4db463' : '#ee7c5f'} stroke={INK} strokeWidth="4" strokeLinejoin="round"
              animate={{ x: [0, 9, 0] }} transition={{ repeat: Infinity, duration: 1.1 }} />
          </g>

          {/* Bình nước: chạm giữ để nghiêng bình và rót */}
          <motion.g onPointerDown={down} onPointerUp={up} onPointerCancel={up} className="cursor-pointer" aria-label="Bình nước" data-pitcher
            initial={false} animate={{ rotate: pouring ? 58 : 0 }} transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            style={{ transformBox: 'view-box', transformOrigin: '300px 122px' }}>
            <rect x="110" y="20" width="230" height="240" fill="transparent" />
            <path d="M176 150 H140 q-22 0 -22 30 v18 q0 30 22 30 H176" fill="none" stroke={INK} strokeWidth="18" strokeLinecap="round" />
            <path d="M176 150 H140 q-22 0 -22 30 v18 q0 30 22 30 H176" fill="none" stroke="#f08a3c" strokeWidth="8" strokeLinecap="round" />
            <path d="M172 110 H292 L318 96 L300 128 V236 q0 14 -14 14 H186 q-14 0 -14 -14 Z" fill="#dff3ff" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
            <path d="M178 150 H294 V234 q0 10 -10 10 H188 q-10 0 -10 -10 Z" fill="#4bb4f0" />
            <rect x="178" y="150" width="116" height="7" fill="#a6dcfb" />
            <rect x="188" y="124" width="9" height="104" rx="4" fill="#fff" opacity=".7" />
            <motion.circle cx="236" cy="62" r="20" fill="#fff" stroke={INK} strokeWidth="4" animate={pouring || phase !== 'play' ? { opacity: 0 } : { opacity: 1, scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
            {!pouring && phase === 'play' && <text x="236" y="72" textAnchor="middle" fontSize="28">👆</text>}
          </motion.g>
        </svg>
      </div>
    </GameScreen>
  );
}
