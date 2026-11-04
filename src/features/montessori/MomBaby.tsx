import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Emoji } from '@/components/content/Emoji';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import { MOM_BABY, type MomBaby as Pair } from '@/data/montessori';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import type { GameProps } from '@/features/registry';

const ROUNDS = 4;
const MOM = 'min(22vh, 15vw)';
/** Con có hình riêng (gà con) vẽ cỡ vừa; con dùng chung hình với mẹ vẽ nhỏ hẳn cho rõ "con". */
const babySize = (p: Pair) => (p.baby.emoji === p.mom.emoji ? 'min(11vh, 7.5vw)' : 'min(14vh, 9.5vw)');

/** Mẹ và con: kéo con vật con về đúng mẹ. Lượt đầu 2 cặp, sau 3 cặp. */
export function MomBaby({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'mom-baby', rounds: ROUNDS });
  const pairs = useMemo(() => shuffle(MOM_BABY).slice(0, s.round < 2 ? 2 : 3), [s.round, s.game]);
  const babies = useMemo(() => shuffle(pairs), [pairs]);
  const [matched, setMatched] = useState<string[]>([]);
  const [bounce, setBounce] = useState<{ id: string; k: number } | null>(null);

  useEffect(() => {
    setMatched([]);
    preloadVoice([PHRASES.momBabyHint, ...MOM_BABY.flatMap((p) => [p.mom.name, p.baby.name])], 'vi').then(() => say(PHRASES.momBabyHint));
  }, [pairs]); // eslint-disable-line react-hooks/exhaustive-deps

  const dnd = useDragDrop<Pair>(async (p, zone) => {
    if (!zone) return;
    if (zone !== p.id) {
      s.miss();
      setBounce({ id: p.id, k: Date.now() });
      feedbackWrong(pairs.find((x) => x.id === zone)?.mom.name); // "Mèo mẹ. Thử lại nhé!"
      return;
    }
    const next = [...matched, p.id];
    setMatched(next);
    await feedbackCorrect(p.mom.name).done; // "Đúng rồi! Gà mẹ"
    if (next.length === pairs.length) setTimeout(s.win, 300);
  }, { accept: (p, zone) => zone === p.id });

  return (
    <GameScreen title="Mẹ và con" color="peach" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.momBabyHint)}>
      <div className="flex min-h-0 flex-1 flex-col justify-around gap-3">
        <div className="flex justify-center gap-[4vw]">
          {pairs.map((p) => (
            <button key={p.id} data-drop={p.id} aria-label={p.mom.name} onClick={() => say(p.mom.name)}
              className="flex items-end gap-1 rounded-[28px] border-4 border-dashed border-peach/40 bg-white/60 p-3">
              <Emoji glyph={p.mom.emoji} size={MOM} />
              <span className="grid place-items-end" style={{ width: babySize(p), height: babySize(p) }}>
                {matched.includes(p.id) && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><Emoji glyph={p.baby.emoji} size={babySize(p)} /></motion.span>
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-[5vw]">
          {babies.map((p) => (
            <motion.div key={`${p.id}-${bounce?.id === p.id ? bounce.k : 0}`}
              animate={bounce?.id === p.id ? { x: [0, -10, 10, 0] } : {}}
              onPointerDown={(e) => {
                if (matched.includes(p.id)) return;
                say(p.baby.name);
                dnd.start(e, p, <Emoji glyph={p.baby.emoji} size={babySize(p)} />);
              }}
              aria-label={p.baby.name} data-piece={matched.includes(p.id) ? undefined : p.id}
              className={`grid touch-none place-items-center rounded-[26px] bg-paper p-4 shadow-[0_6px_0_var(--color-line)] ${matched.includes(p.id) ? 'invisible' : 'cursor-grab'}`}
              style={{ opacity: dnd.dragging?.id === p.id ? 0.3 : undefined }}>
              <Emoji glyph={p.baby.emoji} size={babySize(p)} />
            </motion.div>
          ))}
        </div>
      </div>
      {dnd.ghost}
    </GameScreen>
  );
}
