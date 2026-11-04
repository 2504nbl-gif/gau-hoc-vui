import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { TopBar } from '@/components/ui/TopBar';
import { Modal } from '@/components/ui/Modal';
import { PressButton } from '@/components/ui/PressButton';
import { CardVisual } from '@/components/content/CardVisual';
import { BearMascot } from '@/components/content/BearMascot';
import { useNav } from '@/store/useNav';
import { currentStreak, useDailyStore, useStreak } from '@/store/useDailyStore';
import { PHRASES } from '@/data/phrases';
import { say, sayAll, stopVoice } from '@/services/audio/voice';
import { sfx } from '@/services/audio/sfx';
import { dayKey, stepInfo } from './plan';
import { StreakChip, streakParts } from './StreakChip';

const STATION = 'min(20vh, 13vw)';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Câu chúc mừng xong lộ trình (+ số ngày liền nếu từ 2 ngày). */
const sayCongrats = () => {
  const n = currentStreak(useDailyStore.getState());
  sayAll([PHRASES.dailyDone, ...(n >= 2 ? streakParts(n) : [])]);
};

/** Vị trí trạm thứ i (theo % khung): đi từ trái sang phải, lên xuống xen kẽ. */
const point = (i: number, n: number): [number, number] => [9 + (i * 82) / (n - 1), i % 2 === 0 ? 66 : 36];

/** Đường cong mềm qua các điểm. */
const pathThrough = (pts: [number, number][]) =>
  pts.map(([x, y], i) => {
    if (i === 0) return `M${x} ${y}`;
    const [px, py] = pts[i - 1];
    const dx = (x - px) / 2;
    return `C${px + dx} ${py} ${x - dx} ${y} ${x} ${y}`;
  }).join(' ');

/** "Bài học hôm nay": con đường với các trạm, bé đi lần lượt từng trạm. */
export function DailyPath() {
  const go = useNav((s) => s.go);
  const plan = useDailyStore((s) => s.plan);
  const streak = useStreak();
  const [celebrate, setCelebrate] = useState(false);
  const [nudge, setNudge] = useState<{ i: number; k: number } | null>(null);
  const busy = useRef(false);

  // Mỗi lần về đường đi: bỏ chặng đang mở, lập lộ trình nếu sang ngày mới, rồi nhắc hoặc chúc mừng.
  useEffect(() => {
    const st = useDailyStore.getState();
    st.clearActive();
    const p = st.ensureToday();
    const all = p.done.every(Boolean);
    if (all && st.celebratedDay !== p.day) {
      st.markCelebrated(p.day);
      setCelebrate(true);
      sfx.success();
      sfx.applause();
      window.setTimeout(sayCongrats, 700);
    } else if (!all) {
      if (p.done.some(Boolean)) say(PHRASES.dailyNext);
      else sayAll([PHRASES.dailyLesson, PHRASES.dailyStart]);
    }
    return () => stopVoice();
  }, []);

  if (!plan || plan.day !== dayKey()) return null;

  const steps = plan.steps.map(stepInfo);
  const cur = plan.done.findIndex((d) => !d); // -1 = xong hết
  const allDone = cur === -1;
  const n = steps.length + 1; // + đích
  const pts = Array.from({ length: n }, (_, i) => point(i, n));
  const reached = allDone ? n - 1 : cur;

  const tap = async (i: number) => {
    if (busy.current) return;
    const info = steps[i];
    if (!info) return;
    if (i !== cur && !plan.done[i]) {
      sfx.tap();
      setNudge({ i, k: Date.now() });
      say(PHRASES.dailyNext);
      return;
    }
    busy.current = true;
    sfx.select();
    await Promise.race([say(info.title).done, wait(1800)]);
    const route = useDailyStore.getState().start(i);
    busy.current = false;
    if (route) go(route);
  };

  const tapGoal = () => {
    sfx.tap();
    if (allDone) { sfx.applause(); sayCongrats(); } else say(PHRASES.dailyNext);
  };

  return (
    <main
      className="scene relative flex h-full flex-col overflow-hidden py-3"
      style={{ '--c': 'var(--color-peach)', paddingLeft: 'max(20px, env(safe-area-inset-left, 0px))', paddingRight: 'max(20px, env(safe-area-inset-right, 0px))' } as CSSProperties}
    >
      <div className="relative z-20">
        <TopBar title={PHRASES.dailyLesson} onBack={() => go({ name: 'dashboard' })} right={<StreakChip />} />
      </div>

      <div className="relative min-h-0 flex-1">
        {/* Con đường */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <path d={pathThrough(pts)} fill="none" stroke="#d9b877" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 'min(8vh, 5.4vw)' }} />
          <path d={pathThrough(pts)} fill="none" stroke="#f7e6bd" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 'min(6.4vh, 4.3vw)' }} />
          {reached > 0 && (
            <path d={pathThrough(pts.slice(0, reached + 1))} fill="none" stroke="var(--color-sun)" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 'min(2.4vh, 1.6vw)' }} />
          )}
          <path d={pathThrough(pts)} fill="none" stroke="white" strokeLinecap="round" strokeDasharray="2 16" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 'min(0.9vh, 0.6vw)', opacity: 0.8 }} />
        </svg>

        {/* Các trạm */}
        {steps.map((info, i) => {
          if (!info) return null;
          const [x, y] = pts[i];
          const done = plan.done[i];
          const now = i === cur;
          const locked = !done && !now;
          return (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%`, zIndex: now ? 10 : 1 }}>
              {now && (
                <BearMascot className="absolute bottom-[96%] left-1/2 w-[55%] -translate-x-1/2 [animation:bob_1.6s_ease-in-out_infinite]" />
              )}
              <motion.button
                key={nudge?.i === i ? nudge.k : 0}
                aria-label={info.label}
                onClick={() => tap(i)}
                animate={now ? { y: [0, -14, 0], scale: [1, 1.06, 1] } : locked && nudge?.i === i ? { x: [0, -10, 10, -6, 6, 0] } : {}}
                transition={now ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.45 }}
                whileTap={{ scale: 0.92 }}
                className={`relative grid place-items-center rounded-full border-[6px] ${
                  done ? 'border-leaf bg-paper' : now ? 'tint' : 'border-white bg-paper'
                }`}
                style={{
                  width: STATION, height: STATION, '--c': `var(--color-${info.color})`,
                  borderColor: now ? 'var(--c)' : undefined,
                  boxShadow: now
                    ? '0 6px 0 color-mix(in srgb, var(--c) 68%, black), 0 0 0 10px color-mix(in srgb, var(--c) 30%, transparent)'
                    : '0 6px 0 rgba(0,0,0,.12)',
                } as CSSProperties}
              >
                <span className={locked ? 'opacity-45 grayscale' : ''}>
                  <CardVisual visual={info.visual} size="min(10vh, 6.6vw)" />
                </span>
                <span className="absolute -bottom-1 -left-1 grid size-[40%] place-items-center rounded-full bg-paper text-[min(4.4vh,3vw)] shadow-[0_3px_0_var(--color-line)]">
                  {locked ? '🔒' : info.badge}
                </span>
                {done && (
                  <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }}
                    className="absolute -top-2 -right-2 text-[min(7vh,4.6vw)] leading-none drop-shadow">⭐</motion.span>
                )}
              </motion.button>
              <span className={`absolute top-[104%] left-1/2 max-w-[22vw] -translate-x-1/2 truncate rounded-full bg-paper/90 px-3 py-0.5 text-center font-display text-[clamp(12px,1.5vw,16px)] font-extrabold whitespace-nowrap ${locked ? 'text-soft' : 'text-ink'}`}>
                {info.label}
              </span>
            </div>
          );
        })}

        {/* Đích */}
        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${pts[n - 1][0]}%`, top: `${pts[n - 1][1]}%` }}>
          <motion.button
            aria-label="Đích"
            onClick={tapGoal}
            animate={allDone ? { rotate: [0, -8, 8, 0], scale: [1, 1.12, 1] } : {}}
            transition={{ duration: 1.4, repeat: allDone ? Infinity : 0 }}
            className={`grid place-items-center rounded-full border-[6px] ${allDone ? 'border-sun bg-paper' : 'border-white bg-paper'}`}
            style={{ width: STATION, height: STATION, boxShadow: '0 6px 0 rgba(0,0,0,.12)' }}
          >
            <span className={`text-[min(11vh,7.4vw)] leading-none ${allDone ? '' : 'opacity-45 grayscale'}`}>🏆</span>
          </motion.button>
        </div>
      </div>

      <Modal open={celebrate} width="min(440px, 100%)">
        <div className="flex flex-col items-center gap-2 text-center">
          <BearMascot className="w-28" />
          <h2 className="m-0 font-display text-4xl font-extrabold text-leaf">Giỏi quá!</h2>
          <div className="text-3xl tracking-widest">{'⭐'.repeat(plan.steps.length)}</div>
          <p className="m-0 font-bold text-soft">Hôm nay con đã học xong cả {plan.steps.length} trạm</p>
          {streak > 0 && (
            <p className="m-0 font-display text-3xl font-extrabold text-peach">🔥 {streak} ngày liền</p>
          )}
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <PressButton color="leaf" onClick={() => { stopVoice(); go({ name: 'dashboard' }); }}>Về trang chủ</PressButton>
            <PressButton variant="ghost" onClick={() => setCelebrate(false)}>Xem đường đi</PressButton>
          </div>
        </div>
      </Modal>
    </main>
  );
}
