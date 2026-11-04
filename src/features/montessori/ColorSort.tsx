import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Emoji } from '@/components/content/Emoji';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import { COLOR_BINS, type ColorBin, type Thing } from '@/data/montessori';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import type { GameProps } from '@/features/registry';

const ROUNDS = 4;
const SIZE = 'min(15vh, 10vw)';

type Piece = Thing & { id: string; bin: ColorBin['id'] };

/** Phân loại màu: kéo đồ vật vào giỏ cùng màu. Hai lượt đầu 2 giỏ, sau 3 giỏ; mỗi giỏ 2 đồ vật. */
export function ColorSort({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'color-sort', rounds: ROUNDS });
  const bins = useMemo(() => shuffle(COLOR_BINS).slice(0, s.round < 2 ? 2 : 3), [s.round, s.game]);
  const pieces = useMemo<Piece[]>(() => shuffle(bins.flatMap((b) =>
    shuffle(b.items).slice(0, 2).map((t) => ({ ...t, id: `${b.id}-${t.emoji}`, bin: b.id })))), [bins]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [bounce, setBounce] = useState<{ id: string; k: number } | null>(null);

  useEffect(() => {
    setPlaced([]);
    const names = COLOR_BINS.flatMap((b) => [b.name, ...b.items.map((t) => t.name)]);
    preloadVoice([PHRASES.colorSortHint, ...names], 'vi').then(() => say(PHRASES.colorSortHint));
  }, [pieces]); // eslint-disable-line react-hooks/exhaustive-deps

  const binOf = (id: string) => COLOR_BINS.find((b) => b.id === id)!;

  const dnd = useDragDrop<Piece>(async (p, zone) => {
    if (!zone) return;
    if (zone !== p.bin) {
      s.miss();
      setBounce({ id: p.id, k: Date.now() });
      feedbackWrong(binOf(p.bin).name); // "Màu đỏ. Thử lại nhé!" — bé nghe màu của đồ vật
      return;
    }
    const next = [...placed, p.id];
    setPlaced(next);
    await feedbackCorrect(binOf(p.bin).name).done;
    if (next.length === pieces.length) setTimeout(s.win, 300);
  }, { accept: (p, zone) => zone === p.bin });

  return (
    <GameScreen title="Phân loại màu" color="berry" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.colorSortHint)}>
      <div className="flex min-h-0 flex-1 flex-col justify-around gap-3">
        <div className="flex flex-wrap justify-center gap-[3vw]">
          {pieces.map((p) => (
            <motion.div key={`${p.id}-${bounce?.id === p.id ? bounce.k : 0}`}
              animate={bounce?.id === p.id ? { x: [0, -10, 10, 0] } : {}}
              onPointerDown={(e) => {
                if (placed.includes(p.id)) return;
                say(p.name);
                dnd.start(e, p, <Emoji glyph={p.emoji} size={SIZE} />);
              }}
              aria-label={p.name} data-piece={placed.includes(p.id) ? undefined : p.bin}
              className={`grid touch-none place-items-center rounded-[26px] bg-paper p-3 shadow-[0_6px_0_var(--color-line)] ${placed.includes(p.id) ? 'invisible' : 'cursor-grab'}`}
              style={{ opacity: dnd.dragging?.id === p.id ? 0.3 : undefined }}>
              <Emoji glyph={p.emoji} size={SIZE} />
            </motion.div>
          ))}
        </div>
        <div className="flex justify-center gap-[3vw]">
          {bins.map((b) => (
            <button key={b.id} data-drop={b.id} aria-label={b.name} onClick={() => say(b.name)}
              className="relative flex h-[min(34vh,24vw)] w-[min(40vh,26vw)] flex-col items-center justify-end rounded-[30px] border-[6px] pb-2"
              style={{ borderColor: b.hex, background: `color-mix(in srgb, ${b.hex} 28%, white)` }}>
              <div className="absolute inset-x-2 top-2 flex flex-wrap justify-center gap-1">
                {pieces.filter((p) => p.bin === b.id && placed.includes(p.id)).map((p) => (
                  <motion.span key={p.id} initial={{ scale: 0 }} animate={{ scale: 1 }}><Emoji glyph={p.emoji} size="min(10vh, 7vw)" /></motion.span>
                ))}
              </div>
              <Emoji glyph="🧺" size="min(15vh, 10vw)" />
            </button>
          ))}
        </div>
      </div>
      {dnd.ghost}
    </GameScreen>
  );
}
