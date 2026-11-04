import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TopBar } from '@/components/ui/TopBar';
import { PressButton } from '@/components/ui/PressButton';
import { CardVisual } from '@/components/content/CardVisual';
import { ChoiceCard, type ChoiceState } from '@/components/game/ChoiceCard';
import { RoundDots } from '@/components/game/RoundDots';
import { ResultModal, starsFor } from '@/components/game/ResultModal';
import { discoveryLessons, findItem } from '@/data/games';
import { getTopic } from '@/data';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { useNav } from '@/store/useNav';
import { useProgressStore } from '@/store/useProgressStore';
import { preloadVoice, say, sayAll, stopVoice } from '@/services/audio/voice';
import { feedbackCorrect, feedbackDone, feedbackWrong } from '@/services/audio/feedback';
import type { VocabItem } from '@/types/content';

const ITEM_SIZE = 'min(34vh, 24vw)';

/**
 * Kính lúp thần kỳ: hình bị che tối, chỉ lộ qua một vòng kính lúp đang dạo quanh.
 * Bé nhìn một phần rồi chọn đúng hình trong 3 đáp án. Bé cũng kéo được kính lúp.
 */
export function MagnifierGame({ topicId, lesson }: { topicId: string; lesson: number }) {
  const go = useNav((s) => s.go);
  const { childName, addStars, recordGame } = useProgressStore();
  const topic = getTopic(topicId)!;
  const def = discoveryLessons(topic)[lesson];
  const items = useMemo(() => def.targetIds.map((id) => findItem(topicId, id)!), [def, topicId]);

  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [introIdx, setIntroIdx] = useState(-1);
  const [game, setGame] = useState(0); // tăng để chơi lại
  const order = useMemo(() => shuffle(items), [items, game]); // eslint-disable-line react-hooks/exhaustive-deps
  const [round, setRound] = useState(0);
  const [states, setStates] = useState<Record<string, ChoiceState>>({});
  const [shake, setShake] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stars, setStars] = useState<1 | 2 | 3>(3);
  const firstTry = useRef(0); // số lượt đúng ngay lần chạm đầu
  const missed = useRef(false);
  const target = order[round];
  const choices = useMemo(() => shuffle(items), [round, game]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Làm quen: lần lượt giới thiệu 3 hình ──
  useEffect(() => {
    if (phase !== 'intro') return;
    let off = false;
    (async () => {
      await preloadVoice([PHRASES.meetFriends, PHRASES.thisIs, PHRASES.peek, PHRASES.whatIsIt, PHRASES.correct, PHRASES.tryAgain, ...items.map((i) => i.label.vi)], 'vi');
      if (off) return;
      await say(PHRASES.meetFriends).done;
      for (let i = 0; i < items.length && !off; i++) {
        setIntroIdx(i);
        await sayAll([PHRASES.thisIs, items[i].label.vi]).done;
        await new Promise((r) => setTimeout(r, 500));
      }
      if (!off) setPhase('play');
    })();
    return () => { off = true; stopVoice(); };
  }, [phase, items]);

  // ── Mỗi lượt: nhắc bé soi kính lúp ──
  useEffect(() => {
    if (phase !== 'play' || !target) return;
    setRevealed(false);
    setStates({});
    missed.current = false;
    sayAll([PHRASES.peek, PHRASES.whatIsIt]);
  }, [phase, round, game]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = async (it: VocabItem) => {
    if (revealed) return;
    if (it.id !== target.id) {
      missed.current = true;
      setStates((s) => ({ ...s, [it.id]: 'wrong' }));
      setShake((k) => k + 1);
      feedbackWrong(it.label.vi);
      return;
    }
    if (!missed.current) firstTry.current++;
    setRevealed(true);
    setStates(Object.fromEntries(items.map((x) => [x.id, x.id === it.id ? 'right' : 'dim'])));
    await feedbackCorrect(it.label.vi).done;
    await new Promise((r) => setTimeout(r, 600));
    if (round + 1 < order.length) setRound((r) => r + 1);
    else finish();
  };

  const finish = () => {
    const s = starsFor(firstTry.current, order.length);
    setStars(s);
    setPhase('done');
    recordGame(`magnifier-${def.id}`, s, { correct: firstTry.current, total: order.length });
    addStars(s);
    feedbackDone(childName);
  };

  const restart = () => { setGame((g) => g + 1); setRound(0); firstTry.current = 0; setPhase('play'); };
  const back = () => { stopVoice(); go({ name: 'discovery', topicId }); };

  return (
    <main className="room" style={{ '--c': 'var(--color-leaf)' } as CSSProperties}>
      <TopBar title={`${topic.title.vi} · Bài ${lesson + 1}`} onBack={back}
        right={phase === 'play' ? <RoundDots total={order.length} current={round} /> : undefined} />

      {phase === 'intro' ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-[3vw]">
            {items.map((it, i) => (
              <motion.div key={it.id}
                animate={{ scale: i === introIdx ? 1.15 : 0.85, opacity: i <= introIdx ? 1 : 0.25 }}
                className="flex flex-col items-center gap-2 rounded-[28px] bg-paper p-5 shadow-[0_6px_0_var(--color-line)]">
                <CardVisual visual={it.visual} size="min(24vh, 16vw)" />
                <span className="font-display text-2xl font-extrabold">{it.label.vi}</span>
              </motion.div>
            ))}
          </div>
          <PressButton variant="ghost" onClick={() => { stopVoice(); setPhase('play'); }}>Chơi luôn ▶</PressButton>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 sm:flex-row">
          <LensScene key={`${game}-${round}`} item={target} revealed={revealed} />
          <div className="grid min-h-0 grid-cols-3 gap-3 sm:w-[min(24vw,220px)] sm:grid-cols-1">
            {choices.map((it) => (
              <ChoiceCard key={it.id} visual={it.visual} label={it.label.vi} state={states[it.id] ?? 'idle'}
                shakeKey={states[it.id] === 'wrong' ? shake : 0} onPick={() => pick(it)} size="min(13vh, 9vw)" />
            ))}
          </div>
        </div>
      )}

      <ResultModal open={phase === 'done'} stars={stars} message={`${childName} đã nhận ra cả 3 bạn trong bài`}
        onAgain={restart} onExit={back} exitLabel="Bài khác" />
    </main>
  );
}

/** Khung cảnh tối + vòng kính lúp dạo quanh hình. */
function LensScene({ item, revealed }: { item: VocabItem; revealed: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const lens = useRef({ x: 0.5, y: 0.5, drag: false });
  // Vị trí hình ngẫu nhiên mỗi lượt, tránh sát mép.
  const spot = useMemo(() => ({ x: 0.3 + Math.random() * 0.4, y: 0.32 + Math.random() * 0.36 }), []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      const L = lens.current;
      if (!L.drag) {
        // Dạo vòng quanh hình theo hình số 8, chỉ lộ từng phần.
        const gx = spot.x + 0.16 * Math.cos(t * 0.9);
        const gy = spot.y + 0.14 * Math.sin(t * 1.8);
        L.x += (gx - L.x) * 0.05;
        L.y += (gy - L.y) * 0.05;
      }
      el.style.setProperty('--lx', `${L.x * 100}%`);
      el.style.setProperty('--ly', `${L.y * 100}%`);
      raf = requestAnimationFrame(tick);
    };
    lens.current.x = spot.x + 0.2;
    lens.current.y = spot.y;
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spot]);

  const move = (e: React.PointerEvent) => {
    if (!lens.current.drag || !box.current) return;
    const r = box.current.getBoundingClientRect();
    lens.current.x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    lens.current.y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
  };

  return (
    <div
      ref={box}
      className="relative min-h-[40vh] flex-1 touch-none overflow-hidden rounded-[28px] bg-[#fdf6e3] shadow-[inset_0_0_0_4px_white]"
      style={{ '--lx': '50%', '--ly': '50%', '--lr': 'min(15vh, 11vw)' } as CSSProperties}
      onPointerDown={(e) => { lens.current.drag = true; e.currentTarget.setPointerCapture(e.pointerId); move(e); }}
      onPointerMove={move}
      onPointerUp={() => { lens.current.drag = false; }}
      onPointerCancel={() => { lens.current.drag = false; }}
    >
      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100}%` }}>
        <motion.div animate={revealed ? { scale: [1, 1.2, 1], rotate: [0, -6, 6, 0] } : {}} transition={{ duration: 0.7 }}>
          <CardVisual visual={item.visual} size={ITEM_SIZE} />
        </motion.div>
      </div>
      {/* Lớp tối có lỗ tròn tại vị trí kính lúp */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: revealed ? 0 : 1,
          background: 'radial-gradient(circle var(--lr) at var(--lx) var(--ly), transparent 96%, rgba(30, 42, 66, 0.94) 100%)',
        }}
      />
      {/* Vành kính lúp và tay cầm */}
      <AnimatePresence>
        {!revealed && (
          <motion.div exit={{ opacity: 0, scale: 1.4 }} className="pointer-events-none absolute"
            style={{ left: 'var(--lx)', top: 'var(--ly)', width: 'calc(var(--lr) * 2)', height: 'calc(var(--lr) * 2)', translate: '-50% -50%' }}>
            <div className="absolute inset-0 rounded-full border-[7px] border-[#8b5a2b] shadow-[0_0_0_3px_#d9a066,inset_0_0_18px_rgba(255,255,255,.5)]" />
            <div className="absolute top-[86%] left-[86%] h-[14px] w-[46%] origin-left rotate-45 rounded-full bg-[#8b5a2b]" />
          </motion.div>
        )}
      </AnimatePresence>
      {!revealed && (
        <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-sm font-extrabold text-soft">
          Kéo kính lúp để soi
        </span>
      )}
    </div>
  );
}
