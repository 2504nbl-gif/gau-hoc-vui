// 4 cảnh "Tập thổi" (vẽ bằng SVG tự làm) + 4 trò dùng chung khung BlowGame.
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { aimAt, burst } from '@/components/game/Fireworks';
import { PHRASES } from '@/data/phrases';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';
import { BlowGame, type SceneProps } from './BlowGame';

const SVG_CLS = 'absolute inset-0 h-full w-full';

/** Ngôi sao lấp lánh 4 cánh (vẽ SVG, khỏi phụ thuộc font emoji). */
const Sparkle = ({ x, y, r = 26, fill = '#ffd93d' }: { x: number; y: number; r?: number; fill?: string }) => (
  <path transform={`translate(${x} ${y})`} fill={fill}
    d={`M0 ${-r} Q${r * 0.18} ${-r * 0.18} ${r} 0 Q${r * 0.18} ${r * 0.18} 0 ${r} Q${-r * 0.18} ${r * 0.18} ${-r} 0 Q${-r * 0.18} ${-r * 0.18} 0 ${-r}Z`} />
);

/** Bầu trời + mây + cỏ dùng chung. */
function Sky({ ground = true }: { ground?: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id="blow-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe6ff" /><stop offset="1" stopColor="#eef9ff" />
        </linearGradient>
      </defs>
      <rect width="1000" height="560" fill="url(#blow-sky)" />
      {[[180, 90, 1], [760, 70, 0.8], [880, 170, 0.6]].map(([x, y, k]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${k})`} fill="#fff" opacity=".9">
          <ellipse cx="0" cy="0" rx="70" ry="30" /><ellipse cx="-45" cy="10" rx="45" ry="24" /><ellipse cx="50" cy="12" rx="48" ry="22" />
        </g>
      ))}
      {ground && <path d="M0 470 Q250 430 500 465 T1000 455 V560 H0Z" fill="#a8da72" />}
    </>
  );
}

// ── 1. Chong chóng ──
const PIN_COLORS = [
  ['#ee7c5f', '#f2b23a', '#4b9cef', '#4db463'],
  ['#e0547b', '#8d71e8', '#38b6e8', '#f2b23a'],
  ['#f08a3c', '#2bb0a3', '#e0547b', '#4b9cef'],
];

function PinwheelScene({ blown, wind, done, round }: SceneProps) {
  const colors = PIN_COLORS[round % PIN_COLORS.length];
  const angle = (blown * 1100) % 360;
  return (
    <svg viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" className={SVG_CLS} aria-hidden>
      <Sky />
      <defs>
        <radialGradient id="pin-glow"><stop offset="0" stopColor="#fff6b0" /><stop offset=".6" stopColor="#ffe36b" stopOpacity=".55" /><stop offset="1" stopColor="#ffe36b" stopOpacity="0" /></radialGradient>
      </defs>
      <rect x="552" y="250" width="16" height="300" rx="8" fill="#c98b4f" />
      <circle cx="560" cy="250" r={done ? 270 : 230} fill="url(#pin-glow)" opacity={done ? 1 : wind * 0.5}>
        {done && <animate attributeName="r" values="240;290;240" dur="1s" repeatCount="indefinite" />}
      </circle>
      <g transform="translate(560 250)">
        <g transform={`rotate(${angle})`}>
          <g>
            {done && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.35s" repeatCount="indefinite" />}
            {colors.map((c, k) => (
              <g key={k} transform={`rotate(${k * 90})`}>
                <path d="M0 0 L0 -175 L125 -125 Z" fill={c} stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
                <path d="M0 0 L125 -125 L72 -28 Z" fill="#fff" opacity=".35" />
              </g>
            ))}
          </g>
        </g>
        <circle r="18" fill="#fff" stroke="#c98b4f" strokeWidth="6" />
      </g>
      {done && [[380, 120], [760, 110], [400, 380], [740, 400]].map(([x, y], i) => (
        <g key={i} opacity="0">
          <Sparkle x={x} y={y} r={30} />
          <animate attributeName="opacity" values="0;1;0" dur="1s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
        </g>
      ))}
    </svg>
  );
}

// ── 2. Bóng bay ──
const BALLOON_COLORS = ['#ee7c5f', '#4b9cef', '#8d71e8'];

function BalloonScene({ wind, blown, level, done, round }: SceneProps) {
  const [popped, setPopped] = useState(false);
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    if (!done) { setPopped(false); return; }
    // Bay lên rồi nổ thành pháo hoa ở trên cao.
    const t = window.setTimeout(() => {
      const r = ref.current?.getBoundingClientRect();
      if (r) aimAt(r.left + r.width / 2, r.top + r.height / 2);
      burst();
      sfx.pop();
      setPopped(true);
    }, 1100);
    return () => window.clearTimeout(t);
  }, [done]);

  const c = BALLOON_COLORS[round % BALLOON_COLORS.length];
  const rx = (48 + wind * 112) * (1 + 0.035 * level * Math.sin(blown * 40));
  const ry = rx * 1.18;
  const cy = 455 - ry;
  return (
    <svg viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" className={SVG_CLS} aria-hidden>
      <Sky />
      <g style={{ transform: done ? 'translateY(-620px)' : 'none', transition: 'transform 1.2s ease-in' }}>
        <path d={`M500 466 q-14 40 6 70 t-4 60`} fill="none" stroke="#68788e" strokeWidth="3" />
        {!popped && (
          <g ref={ref}>
            <ellipse cx="500" cy={cy} rx={rx} ry={ry} fill={c} />
            <ellipse cx={500 - rx * 0.38} cy={cy - ry * 0.4} rx={rx * 0.18} ry={ry * 0.26} fill="#fff" opacity=".45" transform={`rotate(-25 ${500 - rx * 0.38} ${cy - ry * 0.4})`} />
            <path d="M490 468 L510 468 L500 452 Z" fill={c} />
          </g>
        )}
      </g>
    </svg>
  );
}

// ── 3. Bong bóng xà phòng ──
interface Bub { id: number; size: number; x: number; dur: number }
const BUB_MAX = 12;

function BubbleScene({ blown, done, round, finish }: SceneProps) {
  const [bubs, setBubs] = useState<Bub[]>([]);
  const [popped, setPopped] = useState(0);
  const lastSpawn = useRef(blown);
  const nextId = useRef(0);
  const need = 4 + round;

  // Lượt mới: đếm lại.
  useEffect(() => { setPopped(0); }, [round]);

  // Cứ thổi thêm một chút là ra một bong bóng.
  useEffect(() => {
    if (blown - lastSpawn.current < 0.22) return;
    lastSpawn.current = blown;
    if (done) return;
    setBubs((cur) => cur.length >= BUB_MAX ? cur : [...cur, {
      id: nextId.current++, size: 70 + Math.random() * 70, x: 32 + Math.random() * 55, dur: 10 + Math.random() * 4,
    }]);
  }, [blown, done]);

  const pop = (b: Bub, e: React.PointerEvent) => {
    aimAt(e.clientX, e.clientY);
    burst();
    sfx.pop();
    setBubs((cur) => cur.filter((x) => x.id !== b.id));
    const n = popped + 1;
    setPopped(n);
    if (n >= need) finish();
  };

  return (
    <>
      <svg viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" className={SVG_CLS} aria-hidden>
        <Sky />
        {/* Que thổi bong bóng */}
        <g transform="translate(200 300) rotate(-20)">
          <rect x="-8" y="70" width="16" height="230" rx="8" fill="#e0547b" />
          <circle r="72" fill="#d8f1ff" fillOpacity=".35" stroke="#e0547b" strokeWidth="16" />
        </g>
      </svg>
      {bubs.map((b) => (
        <motion.button
          key={b.id}
          aria-label="Bong bóng"
          onPointerDown={(e) => pop(b, e)}
          initial={{ left: '17%', top: '50%', scale: 0.2, opacity: 0.6 }}
          animate={{ left: `${b.x}%`, top: '-30%', scale: 1, opacity: 1 }}
          transition={{ duration: b.dur, ease: 'linear', left: { duration: b.dur * 0.6, ease: 'easeOut' }, scale: { duration: 1 } }}
          onAnimationComplete={() => setBubs((cur) => cur.filter((x) => x.id !== b.id))}
          className="absolute touch-none rounded-full border-4 border-white/80"
          style={{
            width: b.size, height: b.size, marginLeft: -b.size / 2,
            background: 'radial-gradient(circle at 32% 28%, #fff 0 10%, transparent 12%), radial-gradient(circle at 50% 50%, #d8f1ffaa 40%, #c8a9ff99 70%, #9fe8d8cc 100%)',
            boxShadow: 'inset -6px -8px 16px #ffffff66',
          }}
        />
      ))}
      {/* Đếm bong bóng đã nổ */}
      <div className="absolute bottom-4 left-4 flex gap-2 rounded-full bg-paper/90 p-2 shadow-[0_3px_0_var(--color-line)]" aria-label={`${popped} trên ${need}`}>
        {Array.from({ length: need }, (_, i) => (
          <span key={i} className="size-7 rounded-full border-4" style={{ borderColor: '#c8a9ff', background: i < popped ? '#8d71e8' : 'transparent' }} />
        ))}
      </div>
    </>
  );
}

// ── 4. Thuyền giấy ──
const BOAT_COLORS = ['#ffffff', '#ffe58a', '#ffc4d6'];

function BoatScene({ wind, level, done, round }: SceneProps) {
  const x = 190 + wind * 590;
  const paper = BOAT_COLORS[round % BOAT_COLORS.length];
  return (
    <svg viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" className={SVG_CLS} aria-hidden>
      <Sky ground={false} />
      {/* Hai bờ */}
      <path d="M0 300 H140 Q175 300 160 560 H0Z" fill="#a8da72" />
      <path d="M1000 300 H860 Q825 300 840 560 H1000Z" fill="#a8da72" />
      <path d="M0 300 H140 Q160 300 158 330 H0Z" fill="#8fcb5c" />
      <path d="M1000 300 H860 Q840 300 842 330 H1000Z" fill="#8fcb5c" />
      {/* Cờ ở bờ bên kia (đích) */}
      <rect x="925" y="140" width="10" height="165" rx="5" fill="#8a6a4a" />
      <path d="M935 145 L1000 170 L935 195 Z" fill="#e0547b">
        <animate attributeName="d" values="M935 145 L1000 170 L935 195 Z;M935 145 L995 178 L935 195 Z;M935 145 L1000 170 L935 195 Z" dur="1.2s" repeatCount="indefinite" />
      </path>
      {done && <Sparkle x={930} y={105} r={36} />}
      {/* Mặt nước */}
      <rect x="150" y="320" width="700" height="240" fill="#7cc4f2" />
      {[350, 410, 480].map((y, i) => (
        <path key={y} d={`M100 ${y} q40 -14 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0`} fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="6" strokeLinecap="round">
          <animateTransform attributeName="transform" type="translate" values={`0 0;${i % 2 ? -80 : 80} 0`} dur={`${2.4 + i * 0.6}s`} repeatCount="indefinite" />
        </path>
      ))}
      {/* Thuyền giấy */}
      <g transform={`translate(${x} 330) rotate(${level * 7})`}>
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -9;0 0" dur="1.6s" repeatCount="indefinite" />
          <path d="M-12 -8 L-12 -118 L70 -8 Z" fill={paper} stroke="#a9b8c8" strokeWidth="4" strokeLinejoin="round" />
          <path d="M-12 -118 L-40 -8 L-12 -8 Z" fill={paper} stroke="#a9b8c8" strokeWidth="4" strokeLinejoin="round" opacity=".85" />
          <path d="M-110 -8 L110 -8 L72 38 L-72 38 Z" fill={paper} stroke="#a9b8c8" strokeWidth="4" strokeLinejoin="round" />
          <path d="M-110 -8 L-50 38 M110 -8 L50 38" stroke="#a9b8c8" strokeWidth="3" />
        </g>
      </g>
    </svg>
  );
}

// ── Các trò ──
export const BlowPinwheel = ({ onExit }: GameProps) => (
  <BlowGame id="blow-pinwheel" title="Thổi chong chóng" color="sky" hint={PHRASES.pinwheelHint} donePhrase={PHRASES.pinwheelDone} goal={2.5} Scene={PinwheelScene} onExit={onExit} />
);
export const BlowBalloon = ({ onExit }: GameProps) => (
  <BlowGame id="blow-balloon" title="Thổi bóng bay" color="coral" hint={PHRASES.balloonHint} donePhrase={PHRASES.balloonDone} goal={3} Scene={BalloonScene} onExit={onExit} />
);
export const BlowBubbles = ({ onExit }: GameProps) => (
  <BlowGame id="blow-bubbles" title="Thổi bong bóng" color="grape" hint={PHRASES.bubbleHint} donePhrase={PHRASES.bubbleDone} goal={1} custom Scene={BubbleScene} onExit={onExit} />
);
export const BlowBoat = ({ onExit }: GameProps) => (
  <BlowGame id="blow-boat" title="Thổi thuyền giấy" color="sea" hint={PHRASES.boatHint} donePhrase={PHRASES.boatDone} goal={3.5} Scene={BoatScene} onExit={onExit} />
);
