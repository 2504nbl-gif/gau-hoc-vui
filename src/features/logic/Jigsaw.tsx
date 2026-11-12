import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Emoji } from '@/components/content/Emoji';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import { JIGSAW_EASY, JIGSAW_SCENES, JIGSAW_WIDE, type JigsawPic } from '@/data/logic';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

const ROUNDS = 4;
/** Cạnh một mảnh ghép. */
const U = 'min(31vh, 13.5vw)';

/** Cả bức tranh, co giãn theo khung chứa (mọi kích thước tính bằng %). */
function Picture({ pic }: { pic: JigsawPic }) {
  return (
    <div className="relative size-full" style={{ background: pic.bg }}>
      {pic.parts.map(([g, x, y, w], i) => (
        <Emoji key={i} glyph={g} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${w}%`, height: 'auto', aspectRatio: '1', transform: 'translate(-50%, -50%)' }} />
      ))}
    </div>
  );
}

/** Một mảnh: cửa sổ vuông nhìn vào đúng phần (r, c) của tranh. */
function Piece({ pic, r, c, rows, cols }: { pic: JigsawPic; r: number; c: number; rows: number; cols: number }) {
  return (
    <div className="relative overflow-hidden rounded-[12px]" style={{ width: U, height: U }}>
      <div className="absolute" style={{ width: `${cols * 100}%`, height: `${rows * 100}%`, left: `${-c * 100}%`, top: `${-r * 100}%` }}>
        <Picture pic={pic} />
      </div>
    </div>
  );
}

interface Cell { id: string; r: number; c: number }

/** Xếp hình: kéo từng mảnh vào đúng ô có bóng mờ. 3 lượt 2×2 (hình đơn → cảnh), lượt cuối 2×3. */
export function Jigsaw({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'jigsaw', rounds: ROUNDS });
  const pics = useMemo(() => [...shuffle(JIGSAW_EASY), shuffle(JIGSAW_SCENES)[0], shuffle(JIGSAW_WIDE)[0]], [s.game]);
  const pic = pics[s.round];
  const rows = 2;
  const cols = s.round === ROUNDS - 1 ? 3 : 2;
  const cells = useMemo<Cell[]>(() => Array.from({ length: rows * cols }, (_, i) => ({ id: `${Math.floor(i / cols)}-${i % cols}`, r: Math.floor(i / cols), c: i % cols })), [cols]);
  const tray = useMemo(() => shuffle(cells), [cells, pic]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    setPlaced([]); setSolved(false);
    preloadVoice([PHRASES.jigsawHint, ...pics.map((p) => p.name)], 'vi').then(() => say(PHRASES.jigsawHint));
  }, [pic]); // eslint-disable-line react-hooks/exhaustive-deps

  const dnd = useDragDrop<Cell>(async (cell, zone) => {
    if (!zone) return;
    if (zone !== cell.id) { s.miss(); feedbackWrong(); return; }
    const next = [...placed, cell.id];
    setPlaced(next);
    if (next.length < cells.length) { sfx.select(); return; }
    setSolved(true);
    await feedbackCorrect(pic.name).done;
    setTimeout(s.win, 700);
  }, { accept: (cell, zone) => zone === cell.id, onTap: () => say(pic.name) });

  return (
    <GameScreen title="Xếp hình 4 mảnh" color="sun" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.jigsawHint)}>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-[4vw]">
        {/* Khung tranh */}
        <motion.div key={pic.id} animate={solved ? { scale: [1, 1.06, 1], rotate: [0, -2, 2, 0] } : {}} transition={{ duration: 0.7 }}
          className="grid rounded-[22px] bg-paper p-2 shadow-[0_6px_0_var(--color-line)]"
          style={{ gridTemplateColumns: `repeat(${cols}, auto)`, gap: solved ? 0 : 4 }}>
          {cells.map((cell) => {
            const done = placed.includes(cell.id);
            const hot = dnd.over === cell.id;
            return (
              <div key={cell.id} data-drop={done ? undefined : cell.id} data-slot={cell.id}
                className={`relative rounded-[12px] transition-shadow ${hot ? 'shadow-[0_0_0_5px_var(--color-sun)]' : ''}`}>
                {done ? (
                  <motion.div initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}>
                    <Piece pic={pic} {...cell} rows={rows} cols={cols} />
                  </motion.div>
                ) : (
                  <div className="rounded-[12px] outline-2 -outline-offset-2 outline-dashed outline-sun/70" style={{ opacity: hot ? 0.5 : 0.25, filter: 'grayscale(.6)' }}>
                    <Piece pic={pic} {...cell} rows={rows} cols={cols} />
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
        {/* Khay mảnh ghép */}
        <div className="grid gap-[1.2vw]" style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
          {tray.map((cell, i) => {
            const done = placed.includes(cell.id);
            return (
              <motion.div key={`${pic.id}-${cell.id}`} data-piece={done ? undefined : cell.id}
                initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: i % 2 ? 3 : -3 }}
                transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 300, damping: 16 }}
                onPointerDown={(e) => !done && dnd.start(e, cell, <Piece pic={pic} {...cell} rows={rows} cols={cols} />)}
                className={`touch-none rounded-[14px] border-[3px] border-white shadow-[0_5px_0_var(--color-line)] ${done ? 'invisible' : 'cursor-grab'}`}
                style={{ opacity: dnd.dragging?.id === cell.id ? 0.25 : 1 }}>
                <Piece pic={pic} {...cell} rows={rows} cols={cols} />
              </motion.div>
            );
          })}
        </div>
      </div>
      {dnd.ghost}
    </GameScreen>
  );
}
