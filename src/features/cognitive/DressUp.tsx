import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BearMascot } from '@/components/content/BearMascot';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';
import { CLOTHES, type Cloth, type Slot } from '@/data/cognitive';
import { Emoji } from '@/components/content/Emoji';

// Vị trí từng vùng trên hình gấu (% của khung).
const SLOT_POS: Record<Slot, { x: number; y: number; s: number }> = {
  head: { x: 50, y: 10, s: 1 }, body: { x: 50, y: 52, s: 1.4 }, legs: { x: 50, y: 74, s: 1.2 }, feet: { x: 50, y: 92, s: 0.9 },
};

const ROUNDS = 2;

/** Mặc quần áo: kéo mũ, áo, quần, giày vào đúng chỗ trên người gấu. */
export function DressUp({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'dress-up', rounds: ROUNDS });
  // Mỗi lượt chọn 1 món cho mỗi vùng.
  const outfit = useMemo(() => (['head', 'body', 'legs', 'feet'] as Slot[]).map((sl) => shuffle(CLOTHES.filter((c) => c.slot === sl))[0]), [s.round, s.game]);
  const tray = useMemo(() => shuffle(outfit), [outfit]);
  const [worn, setWorn] = useState<Partial<Record<Slot, Cloth>>>({});

  useEffect(() => {
    setWorn({});
    preloadVoice([PHRASES.dressHint, ...CLOTHES.map((c) => c.name)], 'vi').then(() => say(PHRASES.dressHint));
  }, [outfit]);

  const dnd = useDragDrop<Cloth>(async (c, zone) => {
    if (!zone) return;
    if (zone !== c.slot) { s.miss(); feedbackWrong(c.name); return; }
    sfx.pop();
    const next = { ...worn, [c.slot]: c };
    setWorn(next);
    if (Object.keys(next).length < 4) { say(c.name); return; }
    await feedbackCorrect(c.name).done;
    setTimeout(s.win, 600);
  }, { accept: (c, zone) => zone === c.slot });

  const H = 'min(62vh, 46vw)';
  return (
    <GameScreen title="Mặc áo cho gấu" color="peach" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.dressHint)}>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-[4vw]">
        <div className="relative rounded-[28px] bg-paper shadow-[0_5px_0_var(--color-line)]" style={{ width: `calc(${H} * .72)`, height: H }}>
          {/* Thân gấu đơn giản: đầu là linh vật, thân/chân vẽ bằng khối tròn */}
          <div className="absolute left-1/2 top-[36%] h-[44%] w-[56%] -translate-x-1/2 rounded-[45%] bg-[#b9774a]" />
          <div className="absolute left-[24%] top-[78%] h-[16%] w-[18%] rounded-[40%] bg-[#a8693f]" />
          <div className="absolute right-[24%] top-[78%] h-[16%] w-[18%] rounded-[40%] bg-[#a8693f]" />
          <BearMascot className="absolute left-1/2 top-[4%] w-[62%] -translate-x-1/2" />
          {(Object.keys(SLOT_POS) as Slot[]).map((sl) => {
            const p = SLOT_POS[sl];
            const c = worn[sl];
            return (
              <div key={sl} data-drop={sl}
                className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full ${c ? '' : 'border-4 border-dashed border-peach/50 bg-white/40'}`}
                style={{ left: `${p.x}%`, top: `${p.y}%`, width: `calc(${H} * ${0.2 * p.s})`, height: `calc(${H} * ${0.17 * p.s})` }}>
                {c && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: `calc(${H} * ${0.15 * p.s})`, lineHeight: 1 }}><Emoji glyph={c.emoji} className="block" /></motion.span>}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {tray.map((c) => (
            <div key={c.id} onPointerDown={(e) => !worn[c.slot] && dnd.start(e, c, <Emoji glyph={c.emoji} size="min(12vh,72px)" />)}
              className={`grid size-[min(17vh,104px)] touch-none place-items-center rounded-3xl bg-paper shadow-[0_5px_0_var(--color-line)] ${worn[c.slot] ? 'opacity-20' : 'cursor-grab'}`}>
              <Emoji glyph={c.emoji} size="min(10vh,60px)" />
            </div>
          ))}
        </div>
      </div>
      {dnd.ghost}
    </GameScreen>
  );
}
