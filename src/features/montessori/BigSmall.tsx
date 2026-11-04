import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Emoji } from '@/components/content/Emoji';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import { SIZE_ANIMALS } from '@/data/montessori';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, sayAll, say } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import type { GameProps } from '@/features/registry';

const ROUNDS = 4;
type Size = 'big' | 'small';
const ANIMAL: Record<Size, string> = { big: 'min(26vh, 17vw)', small: 'min(11vh, 7.5vw)' };
const HOUSE: Record<Size, string> = { big: 'min(30vh, 20vw)', small: 'min(15vh, 10vw)' };

/** To và nhỏ: cùng một con vật hai cỡ — con to về nhà to, con nhỏ về nhà nhỏ. */
export function BigSmall({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'big-small', rounds: ROUNDS });
  const deck = useMemo(() => shuffle(SIZE_ANIMALS).slice(0, ROUNDS), [s.game]);
  const animal = deck[s.round];
  const order = useMemo<Size[]>(() => shuffle(['big', 'small']), [s.round, s.game]);
  const [placed, setPlaced] = useState<Size[]>([]);
  const [bounce, setBounce] = useState<{ id: Size; k: number } | null>(null);

  /** "Bé tìm · Con mèo · to nhất" (hoặc nhỏ nhất cho con còn lại). */
  const ask = (left: Size[]) => sayAll([PHRASES.find, animal.name, left.includes('big') ? PHRASES.biggest : PHRASES.smallest]);

  useEffect(() => {
    setPlaced([]);
    preloadVoice([PHRASES.find, PHRASES.biggest, PHRASES.smallest, PHRASES.bigHouse, PHRASES.smallHouse, ...deck.map((a) => a.name)], 'vi')
      .then(() => ask(['big', 'small']));
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps

  const dnd = useDragDrop<Size>(async (size, zone) => {
    if (!zone) return;
    if (zone !== size) { s.miss(); setBounce({ id: size, k: Date.now() }); feedbackWrong(); return; }
    const next = [...placed, size];
    setPlaced(next);
    await feedbackCorrect(size === 'big' ? PHRASES.bigHouse : PHRASES.smallHouse).done;
    if (next.length === 2) { setTimeout(s.win, 300); return; }
    ask(order.filter((x) => !next.includes(x)));
  }, { accept: (size, zone) => zone === size });

  return (
    <GameScreen title="To và nhỏ" color="sun" session={s} rounds={ROUNDS} onExit={onExit}
      onReplay={() => ask(order.filter((x) => !placed.includes(x)))}>
      <div className="flex min-h-0 flex-1 items-center justify-around gap-[4vw]">
        <div className="flex flex-1 items-end justify-center gap-[5vw]">
          {order.map((size) => (
            <motion.div key={`${animal.emoji}-${size}-${bounce?.id === size ? bounce.k : 0}`}
              animate={bounce?.id === size ? { x: [0, -10, 10, 0] } : {}}
              onPointerDown={(e) => !placed.includes(size) && dnd.start(e, size, <Emoji glyph={animal.emoji} size={ANIMAL[size]} />)}
              data-piece={placed.includes(size) ? undefined : size}
              aria-label={`${animal.name} ${size === 'big' ? PHRASES.biggest : PHRASES.smallest}`}
              className={`grid touch-none place-items-center ${placed.includes(size) ? 'invisible' : 'cursor-grab'}`}
              style={{ opacity: dnd.dragging === size ? 0.3 : undefined }}>
              <Emoji glyph={animal.emoji} size={ANIMAL[size]} />
            </motion.div>
          ))}
        </div>
        <div className="flex flex-1 items-end justify-center gap-[3vw]">
          {(['big', 'small'] as Size[]).map((size) => (
            <button key={size} data-drop={size} aria-label={size === 'big' ? PHRASES.bigHouse : PHRASES.smallHouse}
              onClick={() => say(size === 'big' ? PHRASES.bigHouse : PHRASES.smallHouse)}
              className="relative flex flex-col items-center rounded-[28px] border-4 border-dashed border-sun/50 bg-white/60 p-[1.5vw]">
              <Emoji glyph="🏠" size={HOUSE[size]} />
              {placed.includes(size) && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-[8%] left-1/2 -translate-x-1/2">
                  <Emoji glyph={animal.emoji} size={`calc(${ANIMAL[size]} * .6)`} />
                </motion.span>
              )}
            </button>
          ))}
        </div>
      </div>
      {dnd.ghost}
    </GameScreen>
  );
}
