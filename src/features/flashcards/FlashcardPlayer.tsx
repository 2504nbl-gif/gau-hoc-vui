import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'motion/react';
import { CardVisual } from '@/components/content/CardVisual';
import { BearMascot } from '@/components/content/BearMascot';
import { ResultModal } from '@/components/game/ResultModal';
import { useNav } from '@/store/useNav';
import { useFlashcardStore } from '@/store/useFlashcardStore';
import { useProgressStore } from '@/store/useProgressStore';
import { praise, preloadVoice, say, speakItem, stopVoice, type Playback } from '@/services/audio/voice';
import { PHRASES } from '@/data/phrases';
import { spokenText } from '@/data';
import { sfx } from '@/services/audio/sfx';
import type { CardFace } from '@/types/settings';
import type { Lang } from '@/types/content';
import { buildDeck, type DeckCard } from './buildDeck';

const ART = 'min(52vh, 38vw)';

function CardFaceView({ card, face, lang }: { card: DeckCard; face: CardFace; lang: Lang }) {
  const { item } = card;
  const isGlyph = item.visual.kind === 'glyph';
  // Thẻ chữ kiểu Doman: chữ thường, đỏ, đậm, rất to.
  const word = isGlyph ? item.label[lang] : item.label[lang].toLocaleLowerCase(lang);
  const showImage = face !== 'text';
  const showWord = face !== 'image';
  return (
    <div className="flex flex-col items-center justify-center gap-[3vh]">
      {showImage && <CardVisual visual={item.visual} size={face === 'both' ? ART : 'min(62vh, 44vw)'} />}
      {showWord && (
        <span
          className="max-w-[90vw] text-center font-display font-extrabold leading-none text-doman [text-wrap:balance]"
          style={{ fontSize: face === 'text' ? 'min(16vh, 11vw)' : 'min(9vh, 6vw)' }}
        >
          {word}
        </span>
      )}
    </div>
  );
}

export function FlashcardPlayer({ topicIds }: { topicIds: string[] }) {
  const go = useNav((s) => s.go);
  const settings = useFlashcardStore((s) => s.settings);
  const { addStars, recordFlashcards, childName } = useProgressStore();
  const { lang, face, mode, intervalMs } = settings;

  // Bộ thẻ cố định suốt phiên (đổi cài đặt giữa chừng không trộn lại).
  const [round, setRound] = useState(0);
  const deck = useMemo(() => buildDeck(topicIds, settings), [topicIds, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  // Trước khi tráo: tải trước giọng đọc của cả phiên, rồi đếm ngược 3-2-1.
  const [phase, setPhase] = useState<'loading' | 'countdown' | 'play'>('loading');
  const [loadPct, setLoadPct] = useState(0);
  const [count, setCount] = useState<string | null>(null);
  const active = phase === 'play' && !done;
  const voiceRef = useRef<Playback | null>(null);
  const card = deck[index];

  useEffect(() => {
    let cancelled = false;
    const countdown = lang === 'vi' ? [...PHRASES.countdown] : ['Three', 'Two', 'One', "Let's go!"];
    (async () => {
      setPhase('loading');
      setLoadPct(0);
      await preloadVoice([PHRASES.preparing, ...countdown], lang);
      if (cancelled) return;
      const texts = deck.map((c) => spokenText(c.item, lang));
      let first = true;
      const t0 = performance.now();
      await preloadVoice(texts, lang, (p) => {
        if (first && p < 1 && lang === 'vi') say(PHRASES.preparing, 'vi'); // chỉ nói khi thật sự phải chờ
        first = false;
        if (!cancelled) setLoadPct(p);
      });
      // Giữ màn hình chờ tối thiểu một chút cho khỏi nháy.
      await new Promise((r) => setTimeout(r, Math.max(0, 500 - (performance.now() - t0))));
      if (cancelled) return;
      setPhase('countdown');
      for (const step of countdown) {
        if (cancelled) return;
        setCount(step);
        sfx.pop();
        say(step, lang);
        await new Promise((r) => setTimeout(r, step === countdown[countdown.length - 1] ? 1000 : 800));
      }
      if (!cancelled) { setCount(null); setPhase('play'); }
    })();
    return () => { cancelled = true; stopVoice(); };
  }, [round]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(() => {
    setDone(true);
    stopVoice();
    recordFlashcards(topicIds);
    addStars(1, 2); // xong bài: được sticker
    sfx.success();
    sfx.applause();
    window.setTimeout(() => praise(lang), 500);
  }, [topicIds, lang, recordFlashcards, addStars]);

  const next = useCallback(() => {
    if (done) return;
    setDir(1);
    if (index + 1 >= deck.length) finish();
    else setIndex(index + 1);
  }, [done, index, deck.length, finish]);

  const prev = useCallback(() => { setDir(-1); setIndex((i) => Math.max(0, i - 1)); }, []);

  // Mỗi khi thẻ mới hiện ra: tiếng "xoẹt" + đọc tên ngay (âm thanh đã nằm sẵn trong bộ nhớ).
  useEffect(() => {
    if (!active || !card) return;
    sfx.flip();
    voiceRef.current = settings.speak ? speakItem(card.item, lang) : null;
  }, [index, active]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tự động sang thẻ.
  useEffect(() => {
    if (mode !== 'auto' || paused || !active) return;
    // Sang thẻ khi đủ thời gian VÀ cô đã đọc xong tên (không cắt ngang chữ của bé).
    let cancelled = false;
    const minWait = new Promise((r) => setTimeout(r, intervalMs));
    const voiceDone = voiceRef.current?.done ?? Promise.resolve(true);
    Promise.all([minWait, voiceDone]).then(() => { if (!cancelled) window.setTimeout(next, 150); });
    return () => { cancelled = true; };
  }, [mode, paused, active, index, intervalMs, next]);

  // Phím mũi tên / dấu cách cho máy có bàn phím.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!active) return;
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, next, prev]);

  useEffect(() => () => stopVoice(), []);

  const restart = () => { setDone(false); setIndex(0); setPaused(false); setRound((r) => r + 1); };
  const exit = () => { stopVoice(); go({ name: 'flashcards' }); };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (!active) return;
    if (info.offset.x < -70) next();
    else if (info.offset.x > 70) prev();
  };

  // Chạm: chế độ tay thì nửa trái lùi, nửa phải tiến; chế độ tự động thì chạm để tạm dừng.
  const onTap = (e: React.MouseEvent) => {
    if (!active) return;
    if (mode === 'auto') { setPaused((p) => !p); return; }
    const x = e.clientX / window.innerWidth;
    if (x < 0.33) prev(); else next();
  };

  if (!card) return null;
  const firstOfTopic = card.indexInTopic === 1;

  return (
    <main className="relative flex h-full flex-col bg-paper" aria-live="polite">
      {/* Thanh trên */}
      <div
        className="absolute inset-x-0 top-0 z-30 flex items-center gap-3 pt-3"
        style={{ paddingLeft: 'max(20px, env(safe-area-inset-left, 0px))', paddingRight: 'max(20px, env(safe-area-inset-right, 0px))' }}
      >
        <button aria-label="Dừng tráo thẻ" onClick={exit}
          className="press grid size-12 place-items-center rounded-2xl text-2xl font-extrabold" style={{ '--c': 'var(--color-coral)' } as React.CSSProperties}>
          ✕
        </button>
        <span className="rounded-full bg-cloud px-4 py-2 font-extrabold text-soft tabular-nums">
          {card.topic.title[lang]} · {card.indexInTopic}/{card.topicSize}
        </span>
        <div className="flex-1" />
        {mode === 'auto' && (
          <button onClick={() => setPaused((p) => !p)} className="press-ghost h-12 rounded-2xl px-4 font-extrabold">
            {paused ? '▶ Tiếp tục' : '⏸ Tạm dừng'}
          </button>
        )}
      </div>

      {/* Thẻ */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden" onClick={onTap}>
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={`${round}-${index}`}
            custom={dir}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={onDragEnd}
            initial={firstOfTopic ? { scale: 0.7, opacity: 0 } : { x: dir * 80, opacity: 0 }}
            animate={{ x: 0, scale: 1, opacity: 1 }}
            exit={{ x: -dir * 80, opacity: 0 }}
            transition={{ duration: Math.min(0.25, intervalMs / 5000) }}
            className="cursor-grab touch-pan-y active:cursor-grabbing"
          >
            <CardFaceView card={card} face={face} lang={lang} />
          </motion.div>
        </AnimatePresence>
        {paused && !done && (
          <span className="pointer-events-none absolute bottom-6 rounded-full bg-ink/80 px-4 py-2 font-extrabold text-white">Đã tạm dừng · chạm để tiếp tục</span>
        )}
      </div>

      {phase !== 'play' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-paper">
          {phase === 'loading' ? (
            <>
              <BearMascot className="w-32 [animation:bob_1.6s_ease-in-out_infinite]" />
              <p className="m-0 font-display text-3xl font-extrabold text-ink">Cô giáo đang chuẩn bị thẻ…</p>
              <div className="h-4 w-[min(420px,70vw)] overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(loadPct * 100)} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-coral transition-[width] duration-200" style={{ width: `${loadPct * 100}%` }} />
              </div>
            </>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.span
                key={count}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.6, opacity: 0 }}
                className="font-display font-extrabold text-coral"
                style={{ fontSize: count && count.length > 3 ? 'min(14vh,10vw)' : 'min(40vh,26vw)' }}
              >
                {count === 'Ba' || count === 'Three' ? '3' : count === 'Hai' || count === 'Two' ? '2' : count === 'Một' || count === 'One' ? '1' : count}
              </motion.span>
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Thanh tiến độ cả phiên */}
      <div className="h-2 bg-line" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="h-full bg-coral transition-[width] duration-200" style={{ width: `${((index + 1) / deck.length) * 100}%` }} />
      </div>

      <ResultModal open={done} stars={3} message={`${childName} xem xong ${deck.length} thẻ`}
        onAgain={restart} onExit={exit} againLabel="Tráo lại" exitLabel="Chọn chủ đề khác" />
    </main>
  );
}
