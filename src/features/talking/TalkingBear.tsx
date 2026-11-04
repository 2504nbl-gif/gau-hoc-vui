import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BearCharacter, type BearMouth, type BearPart, type BearPose } from '@/components/content/BearCharacter';
import { Emoji } from '@/components/content/Emoji';
import { TopBar } from '@/components/ui/TopBar';
import { useDragDrop } from '@/components/game/useDragDrop';
import { PHRASES } from '@/data/phrases';
import { useNav } from '@/store/useNav';
import { useRewardStore } from '@/store/useRewardStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { sfx } from '@/services/audio/sfx';
import { duckMusic } from '@/services/audio/music';
import { isSpeaking, say, stopVoice } from '@/services/audio/voice';
import { openVoiceChanger, type VoiceChanger, type VoiceState } from '@/services/audio/voiceChanger';
import { bearSfx, playLullaby } from './bearSounds';

type Care = 'food' | 'milk' | 'bath' | 'sleep' | 'dance';
type Mode = Exclude<Care, 'dance'> | null;
type Mic = 'idle' | 'asking' | 'denied' | 'unsupported' | VoiceState;
interface Treat { id: string; glyph: string; kind: 'food' | 'milk' | 'soap' | 'shower' }
interface Fx { id: number; glyph: string; x: number; y: number; kind: 'float' | 'eat' | 'fall' }
interface Bubble { id: number; x: number; y: number; s: number }

const TRAYS: Partial<Record<Care, Treat[]>> = {
  food: [
    { id: 'apple', glyph: '🍎', kind: 'food' }, { id: 'banana', glyph: '🍌', kind: 'food' },
    { id: 'honey', glyph: '🍯', kind: 'food' }, { id: 'cookie', glyph: '🍪', kind: 'food' },
  ],
  milk: [{ id: 'milk', glyph: '🥛', kind: 'milk' }],
  bath: [{ id: 'soap', glyph: '🧼', kind: 'soap' }, { id: 'sponge', glyph: '🧽', kind: 'soap' }, { id: 'shower', glyph: '🚿', kind: 'shower' }],
};

const CARE_BUTTONS: { id: Care; glyph: string; label: string; color: string }[] = [
  { id: 'food', glyph: '🍎', label: 'Cho ăn', color: 'coral' },
  { id: 'milk', glyph: '🥛', label: 'Uống sữa', color: 'sky' },
  { id: 'bath', glyph: '🛁', label: 'Tắm', color: 'teal' },
  { id: 'sleep', glyph: '🌙', label: 'Đi ngủ', color: 'grape' },
  { id: 'dance', glyph: '💃', label: 'Nhảy', color: 'berry' },
];

/** Vị trí miệng gấu trong khung (% của khung 200×240). */
const MOUTH = { x: 50, y: 40 };
const TILE = 'min(15vh, 100px)';
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Gấu biết nói — màn chơi tự do (không cộng sao):
 * nhại giọng bé (micro), chạm vào gấu để gấu phản ứng, và chăm sóc gấu (ăn, uống sữa, tắm, ngủ, nhảy).
 */
export function TalkingBear() {
  const go = useNav((s) => s.go);
  const dancing = useRewardStore((s) => s.queue.length > 0);
  const [mic, setMic] = useState<Mic>('idle');
  const [listenOn, setListenOn] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [react, setReact] = useState<{ pose: BearPose; mouth?: BearMouth; n: number } | null>(null);
  const [fx, setFx] = useState<Fx[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const vc = useRef<VoiceChanger | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const modeRef = useRef<Mode>(null);
  modeRef.current = mode;
  const alive = useRef(true);
  const ids = useRef(0);
  const reactTimer = useRef(0);
  const stopLullaby = useRef<() => void>(() => {});

  // ── Giọng gấu: câu nói cố định; nói xong chờ một chút mới nghe lại (tránh tự nhại mình) ──
  const speak = (text: string) => {
    const pb = say(text, 'vi');
    void pb.done.then(() => vc.current?.hold(500));
    return pb;
  };

  const act = (pose: BearPose, ms: number, sound?: () => void, mouth?: BearMouth) => {
    sound?.();
    vc.current?.hold(ms + 300);
    setReact({ pose, mouth, n: ++ids.current });
    window.clearTimeout(reactTimer.current);
    reactTimer.current = window.setTimeout(() => setReact(null), ms);
  };

  const addFx = (items: Omit<Fx, 'id'>[], ms = 1400) => {
    const made = items.map((f) => ({ ...f, id: ++ids.current }));
    setFx((cur) => [...cur, ...made]);
    window.setTimeout(() => setFx((cur) => cur.filter((f) => !made.includes(f))), ms);
  };

  // ── Micro ──
  const startMic = async () => {
    if (vc.current) return;
    setMic('asking');
    const r = await openVoiceChanger((s) => alive.current && setMic(s));
    if (!alive.current) { if (typeof r !== 'string') r.close(); return; }
    if (typeof r === 'string') { setMic(r); return; }
    vc.current = r;
    setMic('listening');
    setListenOn(true);
  };

  const tapMic = () => {
    sfx.tap();
    if (mic === 'denied' || mic === 'unsupported') { speak(PHRASES.bearNeedMic); void startMic(); return; }
    if (!vc.current) { void startMic(); return; }
    setListenOn((on) => !on);
  };

  useEffect(() => {
    alive.current = true;
    const t = window.setTimeout(() => speak(PHRASES.bearHello), 350);
    // Bố mẹ đã cho phép micro từ trước → nghe luôn, bé không phải bấm.
    navigator.permissions?.query({ name: 'microphone' as PermissionName })
      .then((p) => { if (p.state === 'granted' && alive.current) void startMic(); })
      .catch(() => {});
    return () => {
      alive.current = false;
      window.clearTimeout(t);
      window.clearTimeout(reactTimer.current);
      vc.current?.close();
      vc.current = null;
      stopLullaby.current();
      duckMusic(false);
      stopVoice();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Chỉ nghe khi bé bật micro, gấu không ngủ / không nhảy. Đang nghe hoặc ngủ thì hạ nhạc nền.
  const paused = !listenOn || mode === 'sleep' || dancing;
  const hasMic = mic === 'listening' || mic === 'hearing' || mic === 'speaking' || mic === 'off';
  useEffect(() => {
    vc.current?.setPaused(paused);
    duckMusic((hasMic && !paused) || mode === 'sleep');
  }, [paused, hasMic, mode]);

  // Miệng mấp máy theo độ to âm thanh gấu phát ra (nhại giọng: đo thật; câu nói cố định: mô phỏng).
  useEffect(() => {
    let raf = 0;
    let lvl = 0;
    const loop = () => {
      const now = performance.now();
      let target = vc.current?.level() ?? 0;
      if (!target && isSpeaking()) target = 0.2 + 0.6 * Math.abs(Math.sin(now / 85)) * (0.6 + 0.4 * Math.sin(now / 330));
      lvl = lvl * 0.45 + target * 0.55;
      stage.current?.style.setProperty('--mouth', lvl.toFixed(3));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Ngủ ──
  const sleep = () => {
    setMode('sleep');
    setBubbles([]);
    bearSfx.yawn();
    const { musicOn, musicVolume } = useSettingsStore.getState();
    stopLullaby.current();
    stopLullaby.current = playLullaby(musicOn ? musicVolume : 0);
    void say(PHRASES.bearSleepy, 'vi').done.then((ok) => { if (ok && modeRef.current === 'sleep') say(PHRASES.bearGoodNight, 'vi'); });
  };
  const wake = () => {
    stopLullaby.current();
    stopLullaby.current = () => {};
    setMode(null);
    act('bliss', 1300, bearSfx.wake);
    speak(PHRASES.bearWake);
  };

  // ── Chạm vào gấu ──
  const onPart = (part: BearPart) => {
    if (mode === 'sleep') { wake(); return; }
    if (part === 'belly') act('giggle', 1300, bearSfx.giggle);
    else if (part === 'head') {
      act('bliss', 1600, bearSfx.purr);
      addFx([0, 1, 2].map((i) => ({ glyph: '♥', x: 30 + i * 20 + rnd(-5, 5), y: 12 + rnd(-4, 4), kind: 'float' })));
    } else if (part === 'feet') act('jump', 950, bearSfx.boing);
    else if (part === 'nose') act('sneeze', 1300, bearSfx.sneeze);
  };

  // ── Chăm sóc ──
  const care = (c: Care) => {
    sfx.tap();
    if (c === 'dance') { setMode(null); useRewardStore.getState().dance(); return; }
    if (c === 'sleep') { sleep(); return; }
    if (mode === c) { setMode(null); return; }
    setMode(c);
    speak(c === 'food' ? PHRASES.bearHungry : c === 'milk' ? PHRASES.bearThirsty : PHRASES.bearBath);
  };

  const use = (t: Treat) => {
    if (t.kind === 'food' || t.kind === 'milk') {
      const milk = t.kind === 'milk';
      act('eat', 1500, milk ? bearSfx.gulp : bearSfx.munch, milk ? 'o' : undefined);
      addFx([{ glyph: t.glyph, ...MOUTH, kind: 'eat' }], 900);
      window.setTimeout(() => speak(milk ? PHRASES.bearMilk : PHRASES.bearYummy), 1000);
      return;
    }
    if (t.kind === 'soap') {
      act('bliss', 1000, bearSfx.bubbles);
      setBubbles((b) => [...b, ...Array.from({ length: 5 }, () => ({ id: ++ids.current, x: rnd(22, 78), y: rnd(25, 88), s: rnd(9, 17) }))].slice(-30));
      return;
    }
    // Vòi sen: xả sạch bong bóng.
    bearSfx.shower();
    addFx(Array.from({ length: 12 }, (_, i) => ({ glyph: '', x: 15 + i * 6 + rnd(-3, 3), y: -5, kind: 'fall' as const })), 1300);
    const hadBubbles = bubbles.length > 0;
    window.setTimeout(() => {
      setBubbles([]);
      if (!hadBubbles) { act('giggle', 1000, bearSfx.giggle); return; }
      act('bliss', 1500, bearSfx.sparkle);
      addFx([0, 1, 2, 3].map((i) => ({ glyph: '✨', x: 18 + i * 22, y: 30 + (i % 2) * 30, kind: 'float' })), 1600);
      speak(PHRASES.bearBathDone);
    }, 1000);
  };

  const dnd = useDragDrop<Treat>((t, zone) => { if (zone === 'bear') use(t); }, { onTap: use });

  const listening = !paused && (mic === 'listening' || mic === 'hearing');
  const pose: BearPose = react?.pose ?? (mode === 'sleep' ? 'sleep' : listening ? 'listen' : 'idle');
  const mouth: BearMouth | undefined = react?.mouth ?? (pose === 'idle' || pose === 'listen' ? 'talk' : undefined);
  const tray = mode ? TRAYS[mode] : undefined;

  return (
    <main
      className="scene relative flex h-full flex-col gap-2 overflow-hidden py-3"
      style={{ '--c': 'var(--color-peach)', paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(16px, env(safe-area-inset-right, 0px))' } as CSSProperties}
    >
      <TopBar title={PHRASES.talkingBear} onBack={() => go({ name: 'dashboard' })} />

      <section className="relative flex min-h-0 flex-1 items-center justify-center gap-[3vw]">
        {/* khay đồ (trái) */}
        <div className="grid content-center gap-3" style={{ minWidth: TILE, gridTemplateColumns: `repeat(${tray && tray.length > 3 ? 2 : 1}, ${TILE})` }}>
          <AnimatePresence mode="popLayout">
            {tray?.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ x: -120, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -120, opacity: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 22 }}
                onPointerDown={(e) => dnd.start(e, t, <Emoji glyph={t.glyph} size={`calc(${TILE} * .75)`} />)}
                aria-label={t.id}
                className="grid cursor-grab touch-none place-items-center rounded-3xl bg-paper shadow-[0_5px_0_var(--color-line)]"
                style={{ width: TILE, height: TILE }}
              >
                <Emoji glyph={t.glyph} size={`calc(${TILE} * .6)`} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* gấu */}
        <div ref={stage} data-drop="bear" aria-label="Gấu" className="relative z-30 aspect-[200/240] h-full max-h-[70vh]">
          <BearCharacter
            key={react?.n ?? 0}
            pose={pose}
            mouth={mouth}
            onPart={onPart}
            className="h-full w-full cursor-pointer touch-none drop-shadow-[0_10px_0_rgba(0,0,0,.08)]"
          />
          {bubbles.map((b) => (
            <motion.span
              key={b.id}
              aria-hidden
              className="pointer-events-none absolute rounded-full border-2 border-white/90"
              style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.s}%`, aspectRatio: '1', translate: '-50% -50%',
                background: 'radial-gradient(circle at 32% 30%, #fff 0 14%, rgba(190,226,255,.55) 38%, rgba(255,255,255,.18) 72%)' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1, y: [0, -6, 0] }}
              transition={{ scale: { type: 'spring', stiffness: 400, damping: 12 }, y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
            />
          ))}
          {fx.map((f) => <FxItem key={f.id} fx={f} />)}
          {mode === 'sleep' && <Zzz />}
        </div>

        {/* micro (phải) */}
        <div className="grid place-items-center" style={{ width: TILE }}>
          <MicButton mic={mic} on={listenOn && hasMic} hearing={mic === 'hearing' && !paused} onClick={tapMic} />
        </div>
      </section>

      <nav aria-label="Chăm sóc gấu" className="relative z-10 flex justify-center gap-[clamp(8px,2vw,20px)]">
        {CARE_BUTTONS.map((b) => (
          <motion.button
            key={b.id}
            whileTap={{ scale: 0.92 }}
            onClick={() => care(b.id)}
            aria-label={b.label}
            aria-pressed={mode === b.id}
            className={`press flex flex-col items-center justify-center rounded-3xl font-display font-extrabold leading-none ${mode === b.id ? 'ring-4 ring-white' : ''}`}
            style={{ '--c': `var(--color-${b.color})`, width: 'clamp(72px, 15vh, 112px)', height: 'clamp(64px, 14vh, 100px)' } as CSSProperties}
          >
            <Emoji glyph={b.glyph} size="clamp(34px, 7.5vh, 56px)" />
            <span className="mt-0.5 text-[clamp(12px,2.2vh,16px)]">{b.label}</span>
          </motion.button>
        ))}
      </nav>

      {(mic === 'denied' || mic === 'unsupported') && (
        <p role="status" className="absolute top-[72px] right-4 z-10 m-0 max-w-[34ch] rounded-2xl bg-paper/95 px-3 py-2 text-sm font-bold text-soft shadow-[0_3px_0_var(--color-line)]">
          {mic === 'denied'
            ? 'Bố mẹ ơi: trình duyệt đang chặn micro. Chạm biểu tượng ổ khóa cạnh địa chỉ trang → cho phép Micro, rồi chạm nút micro lần nữa.'
            : 'Bố mẹ ơi: máy chưa có micro (hoặc trang chưa mở qua https) nên Gấu chưa nhại giọng được. Các trò khác vẫn chơi bình thường.'}
        </p>
      )}

      <AnimatePresence>
        {mode === 'sleep' && (
          <motion.div
            role="button"
            aria-label={PHRASES.bearWake}
            onClick={wake}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-20 bg-[linear-gradient(#1c2750ee,#34467ce6)]"
          >
            {[[10, 14], [82, 10], [64, 26], [24, 34], [90, 44], [6, 62], [76, 70], [40, 12]].map(([x, y], i) => (
              <span key={i} aria-hidden className="absolute text-xl text-white/80 [animation:bob_3s_ease-in-out_infinite]" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.4}s` }}>✦</span>
            ))}
            <span aria-hidden className="absolute top-[8%] right-[12%] text-[clamp(48px,9vh,80px)]"><Emoji glyph="🌙" /></span>
          </motion.div>
        )}
      </AnimatePresence>

      {dnd.ghost}
    </main>
  );
}

function FxItem({ fx }: { fx: Fx }) {
  const pos: CSSProperties = { left: `${fx.x}%`, top: `${fx.y}%`, translate: '-50% -50%' };
  if (fx.kind === 'eat') return (
    <motion.span aria-hidden className="pointer-events-none absolute text-[clamp(36px,8vh,64px)]" style={pos}
      initial={{ scale: 1.1 }} animate={{ scale: [1.1, 0.8, 0.5, 0], rotate: [0, -10, 10, 0] }} transition={{ duration: 0.9 }}>
      <Emoji glyph={fx.glyph} />
    </motion.span>
  );
  if (fx.kind === 'fall') return (
    <motion.span aria-hidden className="pointer-events-none absolute h-[5%] w-[2.2%] rounded-full bg-sky/80" style={pos}
      initial={{ y: 0, opacity: 0 }} animate={{ y: ['0%', '1800%'], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.9, delay: Math.random() * 0.3, repeat: 1, ease: 'easeIn' }} />
  );
  return (
    <motion.span aria-hidden className="pointer-events-none absolute font-display text-[clamp(28px,6vh,48px)] font-extrabold text-berry" style={pos}
      initial={{ y: 0, opacity: 0, scale: 0.4 }} animate={{ y: -60, opacity: [0, 1, 1, 0], scale: 1 }} transition={{ duration: 1.3, ease: 'easeOut' }}>
      {fx.glyph.length > 1 ? <Emoji glyph={fx.glyph} /> : fx.glyph}
    </motion.span>
  );
}

/** Chữ Z bay lên khi gấu ngủ. */
function Zzz() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} aria-hidden className="pointer-events-none absolute font-display font-extrabold text-white"
          style={{ left: '68%', top: '8%', fontSize: `clamp(${20 + i * 8}px, ${3 + i}vh, ${34 + i * 10}px)` }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: [0, 20, 40], y: [0, -40, -80], opacity: [0, 1, 0] }}
          transition={{ duration: 2.4, delay: i * 0.8, repeat: Infinity, ease: 'easeOut' }}>
          Z
        </motion.span>
      ))}
    </>
  );
}

/** Nút micro to: tự vẽ (không cần emoji), vòng sáng tỏa ra khi đang nghe/đang thu. */
function MicButton({ mic, on, hearing, onClick }: { mic: Mic; on: boolean; hearing: boolean; onClick: () => void }) {
  const blocked = mic === 'denied' || mic === 'unsupported';
  const idle = mic === 'idle';
  const color = blocked ? 'var(--color-soft)' : on ? 'var(--color-leaf)' : 'var(--color-sea)';
  return (
    <motion.button
      onClick={onClick}
      aria-label={on ? 'Tắt micro' : 'Bật micro'}
      aria-pressed={on}
      animate={idle ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={idle ? { duration: 1.4, repeat: Infinity } : undefined}
      whileTap={{ scale: 0.9 }}
      className={`${on || idle ? 'press' : 'press-ghost'} relative grid aspect-square w-full place-items-center rounded-full ${mic === 'asking' ? 'opacity-60' : ''}`}
      style={{ '--c': color } as CSSProperties}
    >
      {on && (
        <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-full border-4"
          style={{ borderColor: color }}
          animate={{ scale: hearing ? [1, 1.45] : [1, 1.2], opacity: [0.8, 0] }}
          transition={{ duration: hearing ? 0.6 : 1.6, repeat: Infinity, ease: 'easeOut' }} />
      )}
      <svg viewBox="0 0 48 48" className="w-[55%]" aria-hidden>
        <g fill="none" stroke={on || idle ? '#fff' : 'var(--color-soft)'} strokeWidth="4" strokeLinecap="round">
          <rect x="17" y="5" width="14" height="24" rx="7" fill={on || idle ? '#fff' : 'var(--color-soft)'} />
          <path d="M10 22 a14 14 0 0 0 28 0" />
          <path d="M24 36 v6 M16 43 h16" />
          {blocked && <path d="M8 8 L40 40" stroke="var(--color-coral)" strokeWidth="5" />}
        </g>
      </svg>
    </motion.button>
  );
}
