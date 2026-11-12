import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Emoji } from '@/components/content/Emoji';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import { STORY_SEQS, type StoryStep } from '@/data/logic';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

const ROUNDS = 5;
const SIZE = 'min(22vh, 13vw)';
const TINTS = ['#fff1c9', '#d9f2ff', '#ffe0ec'];

/** Tranh của một bước: hình chính, kèm hình phụ ở góc hoặc vết bùn. */
function StepPicture({ step }: { step: StoryStep }) {
  return (
    <span className="relative block" style={{ fontSize: SIZE, lineHeight: 1 }}>
      <Emoji glyph={step.emoji} className="block" />
      {step.mud && [[18, 58, 26, 20], [62, 66, 22, 16], [40, 20, 16, 12], [70, 30, 12, 10]].map(([l, t, w, h], i) => (
        <span key={i} className="absolute rounded-[50%] bg-[#7a4a21]/85" style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%`, rotate: `${i * 25 - 20}deg` }} />
      ))}
      {step.badge && <Emoji glyph={step.badge} className="absolute -right-[14%] -bottom-[10%]" style={{ fontSize: '.52em' }} />}
    </span>
  );
}

const Card = ({ step, tint }: { step: StoryStep; tint: string }) => (
  <div className="grid place-items-center rounded-[26px] border-4 border-white p-[1.8vh] shadow-[0_6px_0_var(--color-line)]" style={{ background: tint }}>
    <StepPicture step={step} />
  </div>
);

/**
 * Trình tự: 3 tranh của một quá trình, kéo xếp vào ô 1-2-3. Hai lượt đầu tranh số 1 đã đặt sẵn;
 * xếp xong app kể lại câu chuyện và từng tranh nhún theo.
 */
export function StoryOrder({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'story-order', rounds: ROUNDS });
  const seqs = useMemo(() => shuffle(STORY_SEQS).slice(0, ROUNDS), [s.game]);
  const seq = seqs[s.round];
  const given = s.round < 2 ? [0] : [];
  const cards = useMemo(() => shuffle([0, 1, 2].filter((i) => !given.includes(i))), [seq]); // eslint-disable-line react-hooks/exhaustive-deps
  const [placed, setPlaced] = useState<number[]>(given);
  /** Tranh đang được kể (−1 = chưa kể). */
  const [telling, setTelling] = useState(-1);

  useEffect(() => {
    setPlaced(given); setTelling(-1);
    preloadVoice([PHRASES.orderHint, seq.tale, ...seq.steps.map((x) => x.name)], 'vi').then(() => say(PHRASES.orderHint));
  }, [seq]); // eslint-disable-line react-hooks/exhaustive-deps

  const dnd = useDragDrop<number>(async (i, zone) => {
    if (!zone) return;
    if (zone !== String(i)) { s.miss(); feedbackWrong(); return; }
    const next = [...placed, i];
    setPlaced(next);
    if (next.length < 3) { sfx.select(); say(seq.steps[i].name); return; }
    await feedbackCorrect().done;
    // Kể lại: tranh 1 → 2 → 3 lần lượt nhún trong lúc đọc.
    setTelling(0);
    const timer = window.setInterval(() => setTelling((t) => (t + 1) % 3), 1400);
    await say(seq.tale).done;
    window.clearInterval(timer);
    setTimeout(s.win, 600);
  }, { accept: (i, zone) => zone === String(i), onTap: (i) => say(seq.steps[i].name) });

  return (
    <GameScreen title="Chuyện gì trước, chuyện gì sau?" color="leaf" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.orderHint)}>
      <div className="flex min-h-0 flex-1 flex-col justify-around gap-2">
        <div className="flex items-center justify-center gap-[1.5vw]">
          {seq.steps.map((step, i) => {
            const done = placed.includes(i);
            const hot = dnd.over === String(i);
            return (
              <div key={`${seq.id}-${i}`} className="flex items-center gap-[1.5vw]">
                {i > 0 && <span className="font-display text-[min(9vh,5vw)] font-extrabold text-leaf/60" aria-hidden>→</span>}
                <motion.div data-drop={done ? undefined : String(i)} data-slot={i}
                  animate={{ scale: hot ? 1.08 : 1, y: telling === i ? [0, -14, 0] : 0 }} transition={{ duration: 0.5 }}
                  onClick={() => done && say(step.name)}
                  className={`relative rounded-[30px] border-4 ${done ? 'border-solid border-leaf bg-paper' : hot ? 'border-solid border-leaf bg-white' : 'border-dashed border-leaf/45 bg-white/60'}`}>
                  <span className="absolute -top-3 -left-3 z-10 grid size-[min(9vh,5.5vw)] place-items-center rounded-full bg-leaf font-display text-[min(6vh,3.6vw)] font-extrabold leading-none text-white shadow-[0_3px_0_#3a8f4c]">{i + 1}</span>
                  {done ? (
                    <motion.div initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 13 }}>
                      <Card step={step} tint={TINTS[i]} />
                    </motion.div>
                  ) : (
                    <div className="invisible"><Card step={step} tint={TINTS[i]} /></div>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-[5vw]">
          {cards.map((i, k) => {
            const done = placed.includes(i);
            const node = <Card step={seq.steps[i]} tint={TINTS[i]} />;
            return (
              <motion.div key={`${seq.id}-${i}`} data-piece={done ? undefined : i}
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: dnd.dragging === i ? 0.25 : 1, rotate: k % 2 ? 3 : -3 }}
                transition={{ delay: 0.1 + k * 0.1, type: 'spring', stiffness: 300, damping: 18 }}
                onPointerDown={(e) => !done && dnd.start(e, i, node)}
                aria-label={seq.steps[i].name}
                className={`touch-none ${done ? 'invisible' : 'cursor-grab'}`}>
                {node}
              </motion.div>
            );
          })}
        </div>
      </div>
      {dnd.ghost}
    </GameScreen>
  );
}
