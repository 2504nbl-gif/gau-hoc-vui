import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import { BUTTON_COLORS, FASTEN_ROUNDS } from '@/data/practical';
import { PHRASES } from '@/data/phrases';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect } from '@/services/audio/feedback';
import { noise, sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

const ROUNDS = FASTEN_ROUNDS.length;
const INK = '#2b3a4f';
const S = { stroke: INK, strokeWidth: 5, strokeLinejoin: 'round' as const };
const FRAME = 'relative aspect-[300/340] h-[min(74vh,52vw)]';
const dark = (c: string) => `color-mix(in srgb, ${c} 72%, black)`;

/** Cái cúc bốn lỗ. */
function ButtonArt({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 60 60" className="size-full drop-shadow-[0_4px_0_rgba(43,58,79,.2)]" aria-hidden>
      <circle cx="30" cy="30" r="26" fill={color} stroke={INK} strokeWidth="4" />
      <circle cx="30" cy="30" r="17" fill="none" stroke={INK} strokeWidth="2.5" opacity=".35" />
      {[[23, 23], [37, 23], [23, 37], [37, 37]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3.6" fill={INK} />)}
    </svg>
  );
}

/** Khung cài cúc: áo sơ mi có n khuyết, bé kéo từng cái cúc trong khay vào khuyết. */
function Buttons({ n, cloth, onDone }: { n: number; cloth: string; onDone: () => void }) {
  /** filled[i] = số thứ tự cái cúc nằm ở khuyết i. */
  const [filled, setFilled] = useState<Record<number, number>>({});
  const used = Object.values(filled);
  const SIZE = 'min(11vh, 7.4vw)';

  const dnd = useDragDrop<number>(async (b, zone) => {
    if (!zone) return;
    const next = { ...filled, [Number(zone)]: b };
    setFilled(next);
    if (Object.keys(next).length < n) { sfx.correct(); return; }
    await feedbackCorrect().done;
    setTimeout(onDone, 400);
  }, { accept: () => true, onTap: () => say('Cái cúc'), pad: 0.6 });

  const top = (i: number) => `${((104 + (i * 196) / (n - 1)) / 340) * 100}%`;

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center gap-[6vw]">
      <div className={FRAME}>
        <svg viewBox="0 0 300 340" className="absolute inset-0 size-full" onClick={() => say('Áo sơ mi')} aria-label="Áo sơ mi">
          <path d="M92 26 L22 62 L8 150 L58 160 L66 112 V322 H234 V112 L242 160 L292 150 L278 62 L208 26 L150 56 Z" fill={cloth} {...S} />
          <path d="M92 26 L150 56 L118 92 Z" fill="#fff" {...S} />
          <path d="M208 26 L150 56 L182 92 Z" fill="#fff" {...S} />
          <rect x="128" y="62" width="44" height="260" fill={dark(cloth)} opacity=".35" />
          <path d="M128 76 V322 M172 76 V322" stroke={INK} strokeWidth="3" strokeDasharray="7 7" opacity=".5" />
          <rect x="188" y="150" width="34" height="38" rx="5" fill="none" stroke={INK} strokeWidth="3" opacity=".45" />
        </svg>
        {Array.from({ length: n }, (_, i) => {
          const b = filled[i];
          return (
            <div key={i} data-drop={b === undefined ? String(i) : undefined} data-hole={i}
              className="absolute left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center" style={{ top: top(i), width: SIZE, height: SIZE }}>
              {b === undefined ? (
                <motion.span animate={{ scale: dnd.over === String(i) ? 1.25 : [1, 1.1, 1] }} transition={{ repeat: dnd.over === String(i) ? 0 : Infinity, duration: 1.4, delay: i * 0.2 }}
                  className="block h-[34%] w-[86%] rounded-full border-[3px] border-white/90 bg-ink/80" />
              ) : (
                <motion.span initial={{ scale: 1.3, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5 }} className="block size-full">
                  <ButtonArt color={BUTTON_COLORS[b % BUTTON_COLORS.length]} />
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
      {/* Khay cúc */}
      <div className="grid grid-cols-2 gap-[min(2.4vh,1.6vw)] rounded-[28px] bg-white/75 p-[min(2.6vh,1.8vw)] shadow-[0_6px_0_var(--color-line)]">
        {Array.from({ length: n }, (_, b) => {
          const gone = used.includes(b);
          const art = <div style={{ width: SIZE, height: SIZE }}><ButtonArt color={BUTTON_COLORS[b % BUTTON_COLORS.length]} /></div>;
          return (
            <div key={b} onPointerDown={(e) => !gone && dnd.start(e, b, art)} aria-label="Cái cúc" data-piece={gone ? undefined : b}
              className={`touch-none ${gone ? 'invisible' : 'cursor-grab'}`} style={{ opacity: dnd.dragging === b ? 0.3 : undefined }}>
              {art}
            </div>
          );
        })}
      </div>
      {dnd.ghost}
    </div>
  );
}

// Đường khóa kéo trong hệ tọa độ SVG: từ dưới (y = 302) lên trên (y = 74).
const ZX = 150, Z0 = 302, Z1 = 74;

/** Khung kéo khóa: nắm đầu khóa kéo thẳng từ dưới lên; ngón tay lệch khỏi đường khóa quá `tol` thì khóa đứng yên. */
function Zipper({ cloth, tol, onDone }: { cloth: string; tol: number; onDone: () => void }) {
  const [p, setP] = useState(0);
  const [held, setHeld] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const st = useRef({ p: 0, step: 0, done: false, moved: false });

  const at = (e: React.PointerEvent) => {
    const m = svg.current!.getScreenCTM()!.inverse();
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
  };
  const down = (e: React.PointerEvent) => {
    if (st.current.done) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sự kiện giả lập */ }
    st.current.moved = false;
    setHeld(true);
    sfx.tap();
  };
  const move = (e: React.PointerEvent) => {
    const c = st.current;
    if (!held || c.done) return;
    const pt = at(e);
    if (Math.abs(pt.x - ZX) > tol) return;
    const v = Math.min(1, Math.max(0, (Z0 - pt.y) / (Z0 - Z1)));
    if (Math.abs(v - c.p) > 0.25) return; // không cho nhảy cóc: phải kéo liền tay
    if (Math.abs(v - c.p) > 0.01) c.moved = true;
    c.p = v;
    const step = Math.round(v * 24);
    if (step !== c.step) { c.step = step; noise(0.035, 0, 'highpass', 2600 + step * 90, 5200, 0.1); }
    if (v >= 0.97) {
      c.done = true; c.p = 1; setP(1); setHeld(false);
      feedbackCorrect().done.then(() => setTimeout(onDone, 400));
      return;
    }
    setP(v);
  };
  const up = () => {
    if (!held) return;
    setHeld(false);
    if (!st.current.moved && !st.current.done) say('Khóa kéo');
  };

  const y = Z0 - p * (Z0 - Z1);
  const open = 6 + 52 * (1 - p); // nửa độ mở của hai vạt áo ở cổ
  const teeth = { stroke: '#f7cd6b', strokeWidth: 9, strokeDasharray: '5 5', fill: 'none' };

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div className={FRAME}>
        <svg ref={svg} viewBox="0 0 300 340" className="absolute inset-0 size-full touch-none overflow-visible" aria-label="Áo khoác"
          data-zip={p.toFixed(2)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <g onClick={() => say('Áo khoác')}>
            <path d="M96 30 L24 66 L6 190 L56 200 L66 120 V324 H234 V120 L244 200 L294 190 L276 66 L204 30 Q150 58 96 30 Z" fill={cloth} {...S} />
            <rect x="66" y="296" width="168" height="28" fill={dark(cloth)} opacity=".4" />
            <path d="M66 296 H234" stroke={INK} strokeWidth="3" opacity=".5" />
            <rect x="84" y="206" width="44" height="34" rx="6" fill="none" stroke={INK} strokeWidth="3" opacity=".45" />
            <rect x="172" y="206" width="44" height="34" rx="6" fill="none" stroke={INK} strokeWidth="3" opacity=".45" />
          </g>
          {/* Phần còn mở: lộ áo trong + hai hàng răng khóa tách ra */}
          {p < 1 && <path d={`M${ZX} ${y} L${ZX - open} 44 Q${ZX} 62 ${ZX + open} 44 Z`} fill="#fff8e6" stroke={INK} strokeWidth="4" strokeLinejoin="round" />}
          <path d={`M${ZX} ${y} L${ZX - open} 46`} {...teeth} />
          <path d={`M${ZX} ${y} L${ZX + open} 46`} {...teeth} />
          {/* Phần đã kéo kín */}
          <path d={`M${ZX} ${Z0 + 22} V${y}`} stroke={INK} strokeWidth="13" strokeLinecap="round" />
          <path d={`M${ZX} ${Z0 + 22} V${y}`} {...teeth} strokeDasharray="4 4" />
          {/* Mũi tên dẫn đường */}
          {p < 0.9 && (
            <motion.path d={`M${ZX + 44} ${y - 36} v-46 m-14 16 l14 -18 l14 18`} fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
              animate={{ y: [0, -12, 0], opacity: held ? 0.5 : 1 }} transition={{ repeat: Infinity, duration: 1 }} pointerEvents="none" />
          )}
          {/* Đầu khóa: vùng chạm to cho ngón tay bé */}
          <g transform={`translate(${ZX} ${y})`} onPointerDown={down} className="cursor-grab" data-zip-pull>
            <circle r="46" fill="transparent" />
            <motion.g animate={{ scale: held ? 1.15 : 1 }}>
              <path d="M-15 -16 H15 L11 12 H-11 Z" fill="#c9d2dc" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
              <rect x="-9" y="8" width="18" height="34" rx="8" fill="#f2b23a" stroke={INK} strokeWidth="4" />
              <circle cy="31" r="4" fill={INK} />
            </motion.g>
          </g>
        </svg>
      </div>
    </div>
  );
}

/** Cài cúc áo / kéo khóa: hai khung thực hành Montessori xen kẽ — 3 cúc, kéo khóa, 4 cúc, kéo khóa (đường hẹp hơn). */
export function Fasten({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'fasten', rounds: ROUNDS });
  const r = FASTEN_ROUNDS[s.round];
  const hint = r.kind === 'buttons' ? PHRASES.buttonHint : PHRASES.zipHint;

  useEffect(() => {
    preloadVoice([PHRASES.buttonHint, PHRASES.zipHint, 'Cái cúc', 'Khóa kéo', 'Áo sơ mi', 'Áo khoác'], 'vi').then(() => say(hint));
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GameScreen title="Cài cúc, kéo khóa" color="sea" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(hint)}>
      {r.kind === 'buttons'
        ? <Buttons key={`${s.game}-${s.round}`} n={r.n} cloth={r.cloth} onDone={s.win} />
        : <Zipper key={`${s.game}-${s.round}`} cloth={r.cloth} tol={r.tol} onDone={s.win} />}
    </GameScreen>
  );
}
