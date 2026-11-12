import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Emoji } from '@/components/content/Emoji';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import { SIZE_ROUNDS, SIZE_THINGS } from '@/data/practical';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

const ROUNDS = SIZE_ROUNDS.length;
const BASE = 'min(23vh, 13.5vw)';
/** Cỡ của vật hạng r (0 = to nhất) trong dãy n vật: giảm đều từ 100% xuống 40%. */
const scaleOf = (r: number, n: number) => 1 - (r * 0.6) / (n - 1);
const sizeOf = (r: number, n: number) => `calc(${BASE} * ${scaleOf(r, n).toFixed(3)})`;

/** Xếp từ to đến nhỏ (kiểu tháp hồng): kéo từng vật vào ô có bóng cùng cỡ; hai vòng cuối đổi chiều nhỏ → to. */
export function SizeOrder({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'size-order', rounds: ROUNDS });
  const { n, asc } = SIZE_ROUNDS[s.round];
  const deck = useMemo(() => shuffle(SIZE_THINGS).slice(0, ROUNDS), [s.game]);
  const thing = deck[s.round];
  const ranks = useMemo(() => Array.from({ length: n }, (_, i) => i), [n]);
  const slots = asc ? [...ranks].reverse() : ranks;
  // Tráo sao cho không trùng sẵn thứ tự đáp án.
  const pieces = useMemo(() => {
    let p = shuffle(ranks);
    while (p.every((r, i) => r === slots[i])) p = shuffle(ranks);
    return p;
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps
  const [placed, setPlaced] = useState<number[]>([]);
  const [bounce, setBounce] = useState<{ id: number; k: number } | null>(null);
  const hint = asc ? PHRASES.sizeAscHint : PHRASES.sizeDescHint;

  useEffect(() => {
    setPlaced([]);
    preloadVoice([PHRASES.sizeAscHint, PHRASES.sizeDescHint, ...deck.map((t) => t.name)], 'vi').then(() => say(hint));
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps

  const dnd = useDragDrop<number>(async (rank, zone) => {
    if (!zone) return;
    if (zone !== String(rank)) { s.miss(); setBounce({ id: rank, k: Date.now() }); feedbackWrong(); return; }
    const next = [...placed, rank];
    setPlaced(next);
    if (next.length < n) { sfx.correct(); return; }
    await feedbackCorrect(thing.name).done;
    setTimeout(s.win, 400);
  }, { accept: (rank, zone) => zone === String(rank), onTap: () => say(thing.name) });

  return (
    <GameScreen title="Xếp từ to đến nhỏ" color="coral" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(hint)}>
      <div className="flex min-h-0 flex-1 flex-col justify-around gap-2">
        {/* Dãy ô có bóng: to dần hoặc nhỏ dần */}
        <div className="mx-auto flex flex-col items-stretch gap-1">
          <div className="flex items-end justify-center gap-[1.6vw]">
            {slots.map((r) => {
              const full = placed.includes(r);
              return (
                <div key={r} data-drop={full ? undefined : String(r)} data-slot={r}
                  className={`grid place-items-center rounded-[22px] border-4 border-dashed p-[0.6vw] transition-colors ${full ? 'border-leaf/60 bg-leaf/10' : dnd.over === String(r) ? 'border-coral bg-coral/15' : 'border-coral/40 bg-white/60'}`}>
                  {full ? (
                    <motion.span initial={{ scale: 0.6 }} animate={{ scale: [1.2, 1] }} className="grid"><Emoji glyph={thing.emoji} size={sizeOf(r, n)} /></motion.span>
                  ) : (
                    <Emoji glyph={thing.emoji} size={sizeOf(r, n)} style={{ filter: 'brightness(0)', opacity: 0.16 }} />
                  )}
                </div>
              );
            })}
          </div>
          {/* Thanh dốc: gợi ý chiều to → nhỏ */}
          <div className="h-[min(2.4vh,14px)] rounded-full bg-coral/50"
            style={{ clipPath: asc ? 'polygon(0 100%, 100% 0, 100% 100%)' : 'polygon(0 0, 100% 100%, 0 100%)' }} aria-hidden />
        </div>

        {/* Các vật cần xếp */}
        <div className="flex items-end justify-center gap-[2.4vw]">
          {pieces.map((r) => {
            const gone = placed.includes(r);
            return (
              <motion.div key={`${s.round}-${r}-${bounce?.id === r ? bounce.k : 0}`}
                animate={bounce?.id === r ? { x: [0, -10, 10, 0] } : {}}
                onPointerDown={(e) => !gone && dnd.start(e, r, <Emoji glyph={thing.emoji} size={sizeOf(r, n)} />)}
                aria-label={thing.name} data-piece={gone ? undefined : r}
                className={`grid touch-none place-items-center ${gone ? 'invisible' : 'cursor-grab'}`}
                style={{ opacity: dnd.dragging === r ? 0.3 : undefined }}>
                <Emoji glyph={thing.emoji} size={sizeOf(r, n)} className="drop-shadow-[0_5px_0_rgba(43,58,79,.12)]" />
              </motion.div>
            );
          })}
        </div>
      </div>
      {dnd.ghost}
    </GameScreen>
  );
}
