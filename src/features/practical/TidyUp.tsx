import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Emoji } from '@/components/content/Emoji';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import type { Thing } from '@/data/montessori';
import { TIDY_PLACES, TIDY_ROUNDS, type TidyPlace } from '@/data/practical';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import type { GameProps } from '@/features/registry';

const ROUNDS = TIDY_ROUNDS.length;
const SIZE = 'min(14vh, 9.5vw)';
const INK = '#2b3a4f';
const S = { stroke: INK, strokeWidth: 5, strokeLinejoin: 'round' as const };

type Piece = Thing & { id: string; place: TidyPlace['id'] };

/** Hình nơi cất đồ (tự vẽ): thùng đồ chơi, tủ quần áo mở cánh, tủ lạnh mở cửa. Đồ đã cất hiện ở khoảng trống giữa hình. */
function PlaceArt({ id }: { id: TidyPlace['id'] }) {
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden>
      {id === 'toys' && <>
        <path d="M22 78 H178 L164 186 H36 Z" fill="#f2b23a" {...S} />
        <path d="M14 62 H186 V84 H14 Z" fill="#f7cd6b" {...S} />
        <path d="M100 150 l8 16 18 2 -13 12 4 18 -17 -9 -17 9 4 -18 -13 -12 18 -2 Z" fill="#fff8e6" opacity=".9" transform="translate(0 -22) scale(1 .9)" />
        <rect x="40" y="96" width="120" height="8" rx="4" fill="#d99a28" />
      </>}
      {id === 'clothes' && <>
        <rect x="40" y="14" width="120" height="172" rx="10" fill="#f3ecff" {...S} />
        <path d="M40 22 L10 34 V176 L40 186 Z" fill="#8d71e8" {...S} />
        <path d="M160 22 L190 34 V176 L160 186 Z" fill="#8d71e8" {...S} />
        <rect x="48" y="34" width="104" height="7" rx="3" fill={INK} />
        <rect x="40" y="150" width="120" height="36" fill="#b9a5f2" {...S} />
        <circle cx="100" cy="168" r="6" fill="#fff8e6" stroke={INK} strokeWidth="3" />
        <circle cx="20" cy="108" r="5" fill="#fff8e6" stroke={INK} strokeWidth="3" />
        <circle cx="180" cy="108" r="5" fill="#fff8e6" stroke={INK} strokeWidth="3" />
      </>}
      {id === 'food' && <>
        <rect x="34" y="10" width="110" height="180" rx="14" fill="#eaf8ff" {...S} />
        <rect x="34" y="60" width="110" height="6" fill={INK} />
        <rect x="44" y="20" width="90" height="32" rx="6" fill="#c7ecfb" />
        <rect x="42" y="124" width="94" height="6" rx="3" fill="#9bd8f5" />
        <path d="M144 14 L186 26 V182 L144 190 Z" fill="#38b6e8" {...S} />
        <rect x="154" y="70" width="8" height="52" rx="4" fill="#fff" stroke={INK} strokeWidth="3" />
        <path d="M82 28 v16 M74 32 l16 8 M90 32 l-16 8" stroke="#38b6e8" strokeWidth="4" strokeLinecap="round" />
      </>}
    </svg>
  );
}

/** Dọn đồ đúng chỗ: đồ chơi vào thùng, quần áo vào tủ, đồ ăn vào tủ lạnh. Hai vòng đầu 2 nơi, sau đó 3 nơi; mỗi nơi 2 món. */
export function TidyUp({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'tidy-up', rounds: ROUNDS });
  const places = useMemo(() => shuffle(TIDY_PLACES).slice(0, TIDY_ROUNDS[s.round]), [s.round, s.game]);
  const pieces = useMemo<Piece[]>(() => shuffle(places.flatMap((p) =>
    shuffle(p.items).slice(0, 2).map((t) => ({ ...t, id: `${p.id}-${t.emoji}`, place: p.id })))), [places]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [bounce, setBounce] = useState<{ id: string; k: number } | null>(null);

  useEffect(() => {
    setPlaced([]);
    const names = TIDY_PLACES.flatMap((p) => [p.name, ...p.items.map((t) => t.name)]);
    preloadVoice([PHRASES.tidyHint, ...names], 'vi').then(() => say(PHRASES.tidyHint));
  }, [pieces]);

  const placeOf = (id: string) => TIDY_PLACES.find((p) => p.id === id)!;

  const dnd = useDragDrop<Piece>(async (p, zone) => {
    if (!zone) return;
    if (zone !== p.place) { s.miss(); setBounce({ id: p.id, k: Date.now() }); feedbackWrong(p.name); return; }
    const next = [...placed, p.id];
    setPlaced(next);
    await feedbackCorrect(placeOf(p.place).name).done;
    if (next.length === pieces.length) setTimeout(s.win, 300);
  }, { accept: (p, zone) => zone === p.place, onTap: (p) => say(p.name) });

  return (
    <GameScreen title="Dọn đồ đúng chỗ" color="teal" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.tidyHint)}>
      <div className="flex min-h-0 flex-1 flex-col justify-around gap-2">
        <div className="flex justify-center gap-[2.2vw]">
          {pieces.map((p) => {
            const gone = placed.includes(p.id);
            return (
              <motion.div key={`${p.id}-${bounce?.id === p.id ? bounce.k : 0}`}
                animate={bounce?.id === p.id ? { x: [0, -10, 10, 0] } : {}}
                onPointerDown={(e) => !gone && dnd.start(e, p, <Emoji glyph={p.emoji} size={SIZE} />)}
                aria-label={p.name} data-piece={gone ? undefined : p.place}
                className={`grid touch-none place-items-center rounded-[24px] bg-paper p-[min(1.6vh,1vw)] shadow-[0_6px_0_var(--color-line)] ${gone ? 'invisible' : 'cursor-grab'}`}
                style={{ opacity: dnd.dragging?.id === p.id ? 0.3 : undefined }}>
                <Emoji glyph={p.emoji} size={SIZE} />
              </motion.div>
            );
          })}
        </div>
        <div className="flex justify-center gap-[5vw]">
          {places.map((pl) => (
            <motion.button key={pl.id} data-drop={pl.id} aria-label={pl.name} onClick={() => say(pl.name)}
              animate={{ scale: dnd.over === pl.id ? 1.07 : 1 }}
              className="relative size-[min(42vh,25vw)] rounded-[26px] border-0 bg-transparent p-0">
              <PlaceArt id={pl.id} />
              <div className={`absolute flex items-center justify-center gap-[2%] ${pl.id === 'toys' ? 'inset-x-[12%] top-[2%] h-[38%]' : pl.id === 'clothes' ? 'inset-x-[24%] top-[24%] h-[48%]' : 'left-[19%] top-[34%] h-[28%] w-[52%]'}`}>
                {pieces.filter((p) => p.place === pl.id && placed.includes(p.id)).map((p) => (
                  <motion.span key={p.id} initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.5 }} className="grid">
                    <Emoji glyph={p.emoji} size="min(11vh, 6.4vw)" />
                  </motion.span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      {dnd.ghost}
    </GameScreen>
  );
}
