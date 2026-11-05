import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import type { GameProps } from '@/features/registry';
import { PairItem, type PairKind, type PairLook, type Pattern } from './PairItem';

const ROUNDS = 4;
const KINDS: PairKind[] = ['sock', 'mitten', 'shoe', 'sock'];
const COLORS = ['#e0547b', '#4b9cef', '#f2b23a', '#4db463', '#8d71e8', '#f08a3c'];
const PATTERNS: Pattern[] = ['dots', 'stripes', 'hearts'];
const SIZE = 'min(24vh, 14vw)';

interface Pair { id: string; look: PairLook }

/** Lượt đầu 2 đôi khác màu; từ lượt 3 có 3 đôi, trong đó 2 đôi cùng màu khác họa tiết (phải nhìn kỹ). */
function makePairs(round: number): Pair[] {
  const kind = KINDS[round % KINDS.length];
  const colors = shuffle(COLORS);
  const pats = shuffle(PATTERNS);
  const looks: PairLook[] = round < 2
    ? [0, 1].map((i) => ({ kind, color: colors[i], pattern: pats[i] }))
    : [{ kind, color: colors[0], pattern: pats[0] }, { kind, color: colors[0], pattern: pats[1] }, { kind, color: colors[1], pattern: pats[2] }];
  return shuffle(looks).map((look, i) => ({ id: `d${i}`, look }));
}

/** Tìm đôi: kéo chiếc giống hệt vào cạnh chiếc kia cho thành đôi. */
export function SockPair({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'sock-pair', rounds: ROUNDS });
  const pairs = useMemo(() => makePairs(s.round), [s.round, s.game]);
  const loose = useMemo(() => shuffle(pairs), [pairs]);
  const [matched, setMatched] = useState<string[]>([]);
  const [bounce, setBounce] = useState<{ id: string; k: number } | null>(null);

  useEffect(() => {
    setMatched([]);
    preloadVoice([PHRASES.pairHint, PHRASES.pairDone], 'vi').then(() => say(PHRASES.pairHint));
  }, [pairs]);

  const dnd = useDragDrop<string>(async (id, zone) => {
    if (!zone) return;
    if (zone !== id) { s.miss(); setBounce({ id, k: Date.now() }); feedbackWrong(); return; }
    const next = [...matched, id];
    setMatched(next);
    await feedbackCorrect(PHRASES.pairDone).done;
    if (next.length === pairs.length) setTimeout(s.win, 300);
  }, { accept: (id, zone) => zone === id });

  return (
    <GameScreen title="Tìm đôi" color="berry" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.pairHint)}>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-around gap-[3vh]">
        <div className="flex flex-wrap items-center justify-center gap-[3vw]">
          {pairs.map((p) => {
            const done = matched.includes(p.id);
            return (
              <motion.div key={p.id} animate={done ? { scale: [1, 1.08, 1] } : {}}
                className="flex items-center gap-[.6vw] rounded-[28px] bg-white/80 p-[1.2vw] shadow-[0_5px_0_var(--color-line)]">
                <PairItem look={p.look} size={SIZE} />
                <div data-drop={done ? undefined : p.id}
                  className={`grid place-items-center rounded-[22px] border-4 border-dashed transition-colors ${done ? 'border-transparent' : dnd.over === p.id ? 'border-berry bg-berry/10' : 'border-berry/40'}`}
                  style={{ width: SIZE, height: SIZE }}>
                  {done && <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }}><PairItem look={p.look} size={SIZE} /></motion.div>}
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-[4vw]">
          {loose.map((p) => (
            <motion.div key={`${p.id}-${bounce?.id === p.id ? bounce.k : 0}`}
              animate={bounce?.id === p.id ? { x: [0, -10, 10, 0] } : {}}
              data-piece={matched.includes(p.id) ? undefined : p.id}
              onPointerDown={(e) => !matched.includes(p.id) && dnd.start(e, p.id, <PairItem look={p.look} size={SIZE} />)}
              className={`touch-none ${matched.includes(p.id) ? 'invisible' : 'cursor-grab'}`}
              style={{ opacity: dnd.dragging === p.id ? 0.3 : undefined }}>
              <PairItem look={p.look} size={SIZE} />
            </motion.div>
          ))}
        </div>
      </div>
      {dnd.ghost}
    </GameScreen>
  );
}
