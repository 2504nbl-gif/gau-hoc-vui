import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CardVisual } from '@/components/content/CardVisual';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { getTopic } from '@/data';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { VocabItem } from '@/types/content';
import type { GameProps } from '@/features/registry';
import { Emoji } from '@/components/content/Emoji';

export const MEMORY_GRIDS = { '2x2': [2, 2], '2x3': [3, 2], '3x4': [4, 3] } as const;
type Grid = keyof typeof MEMORY_GRIDS;

// Đồ chơi quen thuộc (búp bê lật đật…) + con vật.
const EXTRA: VocabItem[] = [
  { id: 'mem-doll', label: { vi: 'Búp bê lật đật', en: 'Nesting doll' }, visual: { kind: 'emoji', value: '🪆' } },
];

/** Lật thẻ ghi nhớ: lật 2 thẻ, giống nhau thì giữ lại. Lưới 2×2, 2×3 hoặc 3×4. */
export function MemoryGame({ onExit, arg }: GameProps) {
  const grid = (arg as Grid) in MEMORY_GRIDS ? (arg as Grid) : '2x2';
  const [cols, rows] = MEMORY_GRIDS[grid];
  const pairs = (cols * rows) / 2;
  const s = useGameSession({ resultId: `memory-${grid}`, rounds: 1 });
  const pool = useMemo(() => [...EXTRA, ...getTopic('toys')!.items, ...getTopic('pets')!.items], []);
  const cards = useMemo(() => {
    const pick = shuffle(pool).slice(0, pairs);
    return shuffle([...pick, ...pick].map((item, i) => ({ key: i, item })));
  }, [s.game, pairs, pool]);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const lock = useRef(false);
  const tries = useRef(0);

  useEffect(() => {
    setOpen([]); setFound([]); tries.current = 0;
    preloadVoice([PHRASES.memoryHint, ...pool.map((p) => p.label.vi)], 'vi').then(() => say(PHRASES.memoryHint));
  }, [cards]); // eslint-disable-line react-hooks/exhaustive-deps

  const flip = async (k: number) => {
    if (lock.current || open.includes(k) || found.includes(cards[k].item.id)) return;
    sfx.flip();
    const next = [...open, k];
    setOpen(next);
    if (next.length < 2) return;
    lock.current = true;
    tries.current++;
    const [a, b] = next.map((i) => cards[i].item);
    if (a.id === b.id) {
      const f = [...found, a.id];
      setFound(f);
      setOpen([]);
      await feedbackCorrect(a.label.vi).done;
      lock.current = false;
      // Sao theo số lần lật: lật ít ≈ nhớ tốt.
      if (f.length === pairs) { if (tries.current > pairs * 2) s.miss(); s.win(); }
    } else {
      setTimeout(() => { setOpen([]); lock.current = false; }, 900);
    }
  };

  const cell = `min(${68 / rows}vh, ${80 / cols}vw)`;
  return (
    <GameScreen title={`Lật thẻ ${grid.replace('x', '×')}`} color="grape" session={s} rounds={1} onExit={onExit} onReplay={() => say(PHRASES.memoryHint)}
      message={`${s.childName} tìm đủ ${pairs} cặp sau ${tries.current} lần lật`}>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="grid gap-[1.5vh]" style={{ gridTemplateColumns: `repeat(${cols}, ${cell})` }}>
          {cards.map((c, k) => {
            const up = open.includes(k) || found.includes(c.item.id);
            return (
              <button key={`${s.game}-${c.key}`} onClick={() => flip(k)} aria-label="Thẻ" className="[perspective:600px]" style={{ width: cell, height: `calc(${cell} * .9)` }}>
                <motion.div className="relative size-full [transform-style:preserve-3d]" animate={{ rotateY: up ? 180 : 0 }} transition={{ duration: 0.35 }}>
                  <span className="absolute inset-0 grid place-items-center rounded-3xl bg-grape text-4xl text-white shadow-[inset_0_-6px_0_rgba(0,0,0,.18)] [backface-visibility:hidden]"><Emoji glyph="🐾" /></span>
                  <span className={`absolute inset-0 grid place-items-center rounded-3xl shadow-[0_5px_0_var(--color-line)] [backface-visibility:hidden] [transform:rotateY(180deg)] ${found.includes(c.item.id) ? 'bg-leaf/15' : 'bg-paper'}`}>
                    <CardVisual visual={c.item.visual} size={`calc(${cell} * .55)`} />
                  </span>
                </motion.div>
              </button>
            );
          })}
        </div>
      </div>
    </GameScreen>
  );
}
