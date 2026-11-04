import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CardVisual } from '@/components/content/CardVisual';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { pictureTopics } from '@/data/games';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

const ROUNDS = 3;

/**
 * Xoay hình: bức tranh chia 2×2, các mảnh bị xoay lệch 90/180/270°.
 * Bé chạm mảnh nào thì mảnh đó xoay thêm 90°; đủ 4 mảnh thẳng là xong.
 */
export function RotateGrid({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'rotate-grid', rounds: ROUNDS });
  const pool = useMemo(() => pictureTopics().filter((t) => ['pets', 'wild', 'fruits', 'vehicles', 'sea'].includes(t.id)).flatMap((t) => t.items), []);
  const item = useMemo(() => shuffle(pool)[0], [s.round, s.game, pool]);
  const [rot, setRot] = useState<number[]>([0, 0, 0, 0]);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    // Lượt 1 xoay 2 mảnh, sau đó xoay cả 4.
    const count = s.round === 0 ? 2 : 4;
    const which = shuffle([0, 1, 2, 3]).slice(0, count);
    setRot([0, 1, 2, 3].map((i) => (which.includes(i) ? [90, 180, 270][Math.floor(Math.random() * 3)] : 0)));
    setSolved(false);
    preloadVoice([PHRASES.rotateHint, item.label.vi], 'vi').then(() => say(PHRASES.rotateHint));
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = async (i: number) => {
    if (solved) return;
    sfx.flip();
    const next = rot.map((r, k) => (k === i ? r + 90 : r));
    setRot(next);
    if (next.every((r) => r % 360 === 0)) {
      setSolved(true);
      await new Promise((r) => setTimeout(r, 400));
      await feedbackCorrect(item.label.vi).done;
      setTimeout(s.win, 400);
    }
  };

  const side = 'min(60vh, 44vw)';
  return (
    <GameScreen title="Xoay hình" color="teal" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.rotateHint)}>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-[4vw]">
        <div className="hidden flex-col items-center gap-2 sm:flex">
          <span className="rounded-full bg-paper px-3 py-1 text-sm font-extrabold text-soft">Hình mẫu</span>
          <div className="grid place-items-center rounded-3xl bg-paper p-3 shadow-[0_5px_0_var(--color-line)]"><CardVisual visual={item.visual} size="min(18vh, 12vw)" /></div>
        </div>
        <div className={`grid grid-cols-2 gap-1.5 rounded-[26px] p-1.5 transition-colors ${solved ? 'bg-leaf' : 'bg-teal/30'}`} style={{ width: side, height: side }}>
          {[0, 1, 2, 3].map((i) => (
            <motion.button key={i} aria-label={`Mảnh ${i + 1}`} onClick={() => tap(i)}
              animate={{ rotate: rot[i] }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="relative overflow-hidden rounded-2xl bg-paper" style={{ gap: solved ? 0 : undefined }}>
              {/* Mỗi mảnh hiển thị đúng 1/4 của bức tranh lớn */}
              <div className="absolute grid place-items-center" style={{ width: '200%', height: '200%', left: i % 2 ? '-100%' : 0, top: i > 1 ? '-100%' : 0 }}>
                <CardVisual visual={item.visual} size={`calc(${side} * .82)`} />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </GameScreen>
  );
}
