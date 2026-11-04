import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CardVisual } from '@/components/content/CardVisual';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import { pictureTopics } from '@/data/games';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import type { VocabItem } from '@/types/content';
import type { GameProps } from '@/features/registry';

const ROUNDS = 4;
const SIZE = 'min(18vh, 13vw)';

/** Tìm bóng: kéo mỗi hình về đúng cái bóng đen của nó. Lượt đầu 2 cặp, sau 3 cặp. */
export function ShadowMatch({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'shadow-match', rounds: ROUNDS });
  const pool = useMemo(() => pictureTopics().filter((t) => !['shapes', 'colors'].includes(t.id)).flatMap((t) => t.items), []);
  const items = useMemo(() => shuffle(pool).slice(0, s.round < 2 ? 2 : 3), [s.round, s.game, pool]);
  const shadows = useMemo(() => shuffle(items), [items]);
  const [matched, setMatched] = useState<string[]>([]);
  const [wiggle, setWiggle] = useState<{ id: string; k: number } | null>(null);

  useEffect(() => {
    setMatched([]);
    preloadVoice([PHRASES.shadowHint, ...pool.map((i) => i.label.vi)], 'vi').then(() => say(PHRASES.shadowHint));
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const dnd = useDragDrop<VocabItem>(async (it, zone) => {
    if (!zone) return; // thả ra ngoài: hình tự nảy về chỗ cũ
    if (zone !== it.id) { s.miss(); feedbackWrong(it.label.vi); return; }
    const next = [...matched, it.id];
    setMatched(next);
    await feedbackCorrect(it.label.vi).done;
    if (next.length === items.length) setTimeout(s.win, 300);
  }, {
    accept: (it, zone) => zone === it.id,
    onTap: (it) => { setWiggle({ id: it.id, k: Date.now() }); say(it.label.vi); },
  });

  const Card = ({ it }: { it: VocabItem }) => (
    <div className="grid place-items-center rounded-[26px] bg-paper p-3 shadow-[0_6px_0_var(--color-line)]">
      <CardVisual visual={it.visual} size={SIZE} />
    </div>
  );

  return (
    <GameScreen title="Tìm bóng" color="teal" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.shadowHint)}>
      <div className="flex min-h-0 flex-1 flex-col justify-around gap-3">
        <div className="flex justify-center gap-[5vw]">
          {items.map((it) => {
            const done = matched.includes(it.id);
            return (
              <motion.div key={`${it.id}-${wiggle?.id === it.id ? wiggle.k : 0}`} data-item={it.id}
                animate={wiggle?.id === it.id ? { rotate: [0, -10, 10, -6, 0] } : {}} transition={{ duration: 0.45 }}
                onPointerDown={(e) => !done && dnd.start(e, it, <Card it={it} />)}
                className={`touch-none ${done ? 'invisible' : 'cursor-grab'}`}
                style={{ opacity: dnd.dragging?.id === it.id ? 0.25 : 1 }}>
                <Card it={it} />
              </motion.div>
            );
          })}
        </div>
        <div className="flex justify-center gap-[5vw]">
          {shadows.map((it) => {
            const done = matched.includes(it.id);
            const hot = dnd.over === it.id;
            return (
              <motion.div key={it.id} data-drop={done ? undefined : it.id} data-shadow={it.id}
                animate={{ scale: hot ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className={`grid place-items-center rounded-[26px] border-4 p-3 transition-colors ${done ? 'border-solid border-leaf bg-paper' : hot ? 'border-solid border-teal bg-white shadow-[0_0_0_8px_rgba(255,255,255,.6)]' : 'border-dashed border-teal/40 bg-white/60'}`}>
                {done ? (
                  <motion.span initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}>
                    <CardVisual visual={it.visual} size={SIZE} />
                  </motion.span>
                ) : (
                  <span className={`brightness-0 transition-opacity ${hot ? 'opacity-90' : 'opacity-70'}`}>
                    <CardVisual visual={it.visual} size={SIZE} />
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      {dnd.ghost}
    </GameScreen>
  );
}
