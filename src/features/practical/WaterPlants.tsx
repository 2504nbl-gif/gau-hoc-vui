import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Emoji } from '@/components/content/Emoji';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { FLOWERS, WATER_ROUNDS } from '@/data/practical';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect } from '@/services/audio/feedback';
import { noise, sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

const ROUNDS = WATER_ROUNDS.length;
const INK = '#2b3a4f';
/** Giây giữ bình để một cây uống đủ nước. */
const GROW_SEC = 2.4;
/** Tưới quá mức này (1 = vừa đủ) thì nước đọng ra đĩa và cô nhắc. */
const TOO_MUCH = 1.5;
const POT_COLORS = ['#ee7c5f', '#f2b23a', '#38b6e8', '#8d71e8'];

/** Cây trong chậu theo lượng nước L (0 = héo rũ, 1 = tươi và nở hoa). */
function Plant({ level, flower, color }: { level: number; flower: string; color: string }) {
  const L = Math.min(1, level);
  const h = 34 + 62 * L;
  const droop = (1 - L) * 48;
  const green = `hsl(${42 + 78 * L} 52% ${40 - 4 * L}%)`;
  const leaf = 0.55 + 0.45 * L;
  return (
    <div className="relative aspect-[120/200] h-full">
      <svg viewBox="0 0 120 200" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        {/* Đĩa lót + nước đọng khi tưới quá tay */}
        <ellipse cx="60" cy="192" rx="50" ry="7" fill="#c9d2dc" stroke={INK} strokeWidth="3" />
        <ellipse cx="60" cy="191" rx={level > 1.12 ? 44 : 0} ry="4.5" fill="#7cc8f5" style={{ transition: 'rx .4s' }} />
        <g transform={`rotate(${droop} 60 140)`} style={{ transition: 'transform .15s linear' }}>
          <path d={`M60 142 Q${60 + 10 * (1 - L)} ${142 - h / 2} 60 ${142 - h}`} fill="none" stroke={green} strokeWidth="8" strokeLinecap="round" />
          <g transform={`translate(60 ${142 - h * 0.45}) scale(${leaf})`}>
            <path d="M0 0 Q-34 -22 -44 6 Q-18 16 0 0 Z" fill={green} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M0 -8 Q34 -32 46 -4 Q20 8 0 -8 Z" fill={green} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          </g>
          {level < 1 && <circle cx="60" cy={142 - h} r={7 + 5 * L} fill={L > 0.6 ? '#f7a8c0' : green} stroke={INK} strokeWidth="2.5" />}
        </g>
        {/* Chậu */}
        <path d="M24 140 H96 L88 190 H32 Z" fill={color} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <rect x="18" y="128" width="84" height="18" rx="7" fill={color} stroke={INK} strokeWidth="5" />
        <rect x="24" y="131" width="72" height="5" rx="2.5" fill="#fff" opacity=".35" />
        <path d={`M38 ${166 - 5 * L} q22 ${10 + 10 * L} 44 0`} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" opacity=".6"
          transform={L < 0.5 ? 'rotate(180 60 168)' : undefined} />
        <circle cx="46" cy="156" r="3.5" fill={INK} opacity=".6" /><circle cx="74" cy="156" r="3.5" fill={INK} opacity=".6" />
      </svg>
      {level >= 1 && (
        <motion.span className="absolute left-1/2 top-[22%] grid" initial={{ scale: 0, x: '-50%', y: '-50%', rotate: -40 }}
          animate={{ scale: 1, x: '-50%', y: '-50%', rotate: 0 }} transition={{ type: 'spring', bounce: 0.55 }}>
          <Emoji glyph={flower} size="min(15vh, 9vw)" />
        </motion.span>
      )}
    </div>
  );
}

/** Bình tưới (vòi sen bên trái). */
function Can({ pouring }: { pouring: boolean }) {
  return (
    <svg viewBox="0 0 150 110" className="size-full overflow-visible drop-shadow-[0_6px_0_rgba(43,58,79,.15)]" aria-hidden>
      <path d="M96 30 q46 -6 46 30 q0 30 -34 26" fill="none" stroke={INK} strokeWidth="15" strokeLinecap="round" />
      <path d="M96 30 q46 -6 46 30 q0 30 -34 26" fill="none" stroke="#2bb0a3" strokeWidth="7" strokeLinecap="round" />
      <path d="M62 62 L22 26" stroke={INK} strokeWidth="17" strokeLinecap="round" />
      <path d="M62 62 L22 26" stroke="#2bb0a3" strokeWidth="9" strokeLinecap="round" />
      <path d="M8 34 L30 10 L36 16 L14 40 Z" fill="#f2b23a" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M52 30 H112 V96 q0 8 -8 8 H60 q-8 0 -8 -8 Z" fill="#2bb0a3" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <rect x="52" y="24" width="60" height="12" rx="6" fill="#59cdc1" stroke={INK} strokeWidth="4" />
      <rect x="61" y="44" width="8" height="46" rx="4" fill="#fff" opacity=".4" />
      {pouring && [0, 1, 2, 3, 4].map((i) => (
        <motion.ellipse key={i} cx={6 + i * 6} cy={30} rx="3.2" ry="5.5" fill="#4bb4f0"
          animate={{ cy: [28 + i * 3, 120], opacity: [1, 0.2] }} transition={{ repeat: Infinity, duration: 0.55, delay: i * 0.1, ease: 'easeIn' }} />
      ))}
    </svg>
  );
}

/** Tưới cây: kéo bình tưới tới chậu cây héo, giữ yên cho nước chảy; cây lớn dần rồi nở hoa. Tưới tiếp cây đã đủ nước thì cô nhắc. */
export function WaterPlants({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'water-plants', rounds: ROUNDS });
  const n = WATER_ROUNDS[s.round];
  const flowers = useMemo(() => shuffle(FLOWERS).slice(0, n), [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps
  const [levels, setLevels] = useState<number[]>([]);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null); // tâm bình, px trong khung cảnh; null = chỗ để bình
  const [target, setTarget] = useState(-1);
  const [held, setHeld] = useState(false);
  const scene = useRef<HTMLDivElement>(null);
  const can = useRef<HTMLDivElement>(null);
  const st = useRef({ levels: [] as number[], raf: 0, last: 0, grab: { x: 0, y: 0 }, from: { x: 0, y: 0 }, moved: false, warned: -1, sound: 0, won: false });

  useEffect(() => {
    const c = st.current;
    c.levels = flowers.map(() => 0); c.warned = -1; c.won = false;
    setLevels(c.levels); setPos(null); setTarget(-1);
    preloadVoice([PHRASES.waterHint, PHRASES.waterEnough, 'Bình tưới', 'Chậu cây', ...FLOWERS.map((f) => f.name)], 'vi').then(() => say(PHRASES.waterHint));
    return () => cancelAnimationFrame(c.raf);
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Chậu nằm ngay dưới vòi sen (mép trái của bình). */
  const potUnderSpout = () => {
    const r = can.current!.getBoundingClientRect();
    const x = r.left + r.width * 0.08;
    let hit = -1;
    scene.current!.querySelectorAll<HTMLElement>('[data-pot]').forEach((el) => {
      const p = el.getBoundingClientRect();
      if (x > p.left - p.width * 0.05 && x < p.right + p.width * 0.05 && r.bottom < p.bottom) hit = Number(el.dataset.pot);
    });
    return hit;
  };

  const tick = (t: number) => {
    const c = st.current;
    const dt = Math.min(0.05, (t - c.last) / 1000);
    c.last = t;
    const i = c.won ? -1 : potUnderSpout();
    setTarget(i);
    if (i >= 0) {
      const before = c.levels[i];
      const now = Math.min(TOO_MUCH, before + dt / GROW_SEC);
      c.levels = c.levels.map((v, j) => (j === i ? now : v));
      setLevels(c.levels);
      if (t - c.sound > 160) { c.sound = t; noise(0.16, 0, 'highpass', 2400, 4200, 0.035); }
      if (before < 1 && now >= 1) {
        const all = c.levels.every((v) => v >= 1);
        if (all) c.won = true;
        feedbackCorrect(flowers[i].name).done.then(() => { if (all) setTimeout(s.win, 500); });
      }
      if (now >= TOO_MUCH && c.warned !== i) { c.warned = i; s.miss(); sfx.wrong(); say(PHRASES.waterEnough); }
    }
    c.raf = requestAnimationFrame(tick);
  };

  const down = (e: React.PointerEvent) => {
    const c = st.current;
    if (c.won || c.raf) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sự kiện giả lập */ }
    const r = can.current!.getBoundingClientRect();
    c.grab = { x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2) };
    c.from = { x: e.clientX, y: e.clientY }; c.moved = false; c.last = performance.now();
    setHeld(true);
    sfx.tap();
    c.raf = requestAnimationFrame(tick);
  };
  const move = (e: React.PointerEvent) => {
    const c = st.current;
    if (!c.raf) return;
    const box = scene.current!.getBoundingClientRect();
    const r = can.current!.getBoundingClientRect();
    const x = Math.min(box.width - r.width / 2, Math.max(r.width / 2, e.clientX - c.grab.x - box.left));
    const y = Math.min(box.height - r.height / 2, Math.max(r.height / 2, e.clientY - c.grab.y - box.top));
    if (Math.hypot(e.clientX - c.from.x, e.clientY - c.from.y) > 10) c.moved = true;
    c.warned = potUnderSpout() === c.warned ? c.warned : -1; // rời chậu rồi quay lại tưới tiếp thì nhắc lại
    setPos({ x, y });
  };
  const up = () => {
    const c = st.current;
    if (!c.raf) return;
    cancelAnimationFrame(c.raf); c.raf = 0;
    setHeld(false); setTarget(-1);
    if (!c.moved) say('Bình tưới');
  };

  const pouring = held && target >= 0;

  return (
    <GameScreen title="Tưới cây" color="leaf" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.waterHint)}>
      <div ref={scene} className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] bg-gradient-to-b from-air to-cloud">
        <div className="absolute right-[4%] top-[5%]" aria-hidden><Emoji glyph="☀️" size="min(13vh, 8vw)" /></div>
        {/* Kệ gỗ */}
        <div className="absolute inset-x-0 bottom-0 h-[9%] border-t-[5px] border-[#8a5a35] bg-[#c99a6b]" aria-hidden />
        <div className="absolute inset-x-0 bottom-[7%] flex h-[62%] items-end justify-center gap-[4vw] pr-[20%]">
          {flowers.map((f, i) => (
            <button key={`${s.round}-${i}`} data-pot={i} data-level={(levels[i] ?? 0).toFixed(2)} aria-label={(levels[i] ?? 0) >= 1 ? f.name : 'Chậu cây'}
              onClick={() => say((levels[i] ?? 0) >= 1 ? f.name : 'Chậu cây')} className="h-full border-0 bg-transparent p-0">
              <Plant level={levels[i] ?? 0} flower={f.emoji} color={POT_COLORS[i % POT_COLORS.length]} />
            </button>
          ))}
        </div>
        {/* Bình tưới: kéo đi khắp nơi; đặt trên chậu thì tự nghiêng và chảy nước */}
        <div ref={can} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-label="Bình tưới" data-can
          className={`absolute aspect-[150/110] w-[min(26vh,17vw)] touch-none ${held ? 'z-20 cursor-grabbing' : 'cursor-grab'}`}
          style={pos ? { left: pos.x, top: pos.y, translate: '-50% -50%' } : { right: '3%', bottom: '10%' }}>
          <motion.div className="size-full" animate={{ rotate: pouring ? -28 : 0, scale: held ? 1.08 : 1, y: held || pos ? 0 : [0, -6, 0] }}
            transition={{ rotate: { type: 'spring', stiffness: 240, damping: 18 }, y: { repeat: Infinity, duration: 1.4 } }}>
            <Can pouring={pouring} />
          </motion.div>
        </div>
      </div>
    </GameScreen>
  );
}
