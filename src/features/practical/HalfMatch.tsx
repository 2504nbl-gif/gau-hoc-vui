import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Emoji } from '@/components/content/Emoji';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import type { Thing } from '@/data/montessori';
import { HALF_ROUNDS, HALF_THINGS } from '@/data/practical';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import type { GameProps } from '@/features/registry';

const ROUNDS = HALF_ROUNDS.length;
const SIZE = 'min(24vh, 15vw)';
/** Nửa cố định (a) và nửa bé kéo (b) theo chiều cắt. */
const CLIP = {
  v: { a: 'inset(0 50% 0 0)', b: 'inset(0 0 0 50%)' },
  h: { a: 'inset(0 0 50% 0)', b: 'inset(50% 0 0 0)' },
};

/** Ghép nửa hình: mỗi hình bị cắt đôi, bé kéo nửa còn lại vào đúng nửa kia. 2 hình → 3 hình, cắt dọc rồi cắt ngang. */
export function HalfMatch({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'half-match', rounds: ROUNDS });
  const { n, cut } = HALF_ROUNDS[s.round];
  const deck = useMemo(() => shuffle(HALF_THINGS), [s.game]);
  // Mỗi vòng lấy hình mới, không lặp trong một ván.
  const things = useMemo(() => {
    const from = HALF_ROUNDS.slice(0, s.round).reduce((a, r) => a + r.n, 0);
    return Array.from({ length: n }, (_, i) => deck[(from + i) % deck.length]);
  }, [deck, s.round, n]);
  const pieces = useMemo(() => {
    let p = shuffle(things);
    while (p.every((t, i) => t === things[i])) p = shuffle(things);
    return p;
  }, [things]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [bounce, setBounce] = useState<{ id: string; k: number } | null>(null);
  const clip = CLIP[cut];

  useEffect(() => {
    setPlaced([]);
    preloadVoice([PHRASES.halfHint, ...HALF_THINGS.map((t) => t.name)], 'vi').then(() => say(PHRASES.halfHint));
  }, [things]);

  const dnd = useDragDrop<Thing>(async (t, zone) => {
    if (!zone) return;
    if (zone !== t.emoji) { s.miss(); setBounce({ id: t.emoji, k: Date.now() }); feedbackWrong(); return; }
    const next = [...placed, t.emoji];
    setPlaced(next);
    await feedbackCorrect(t.name).done;
    if (next.length === n) setTimeout(s.win, 300);
  }, { accept: (t, zone) => zone === t.emoji, pad: 0.1, onTap: (t) => say(t.name) });

  const half = (t: Thing, part: 'a' | 'b') => <Emoji glyph={t.emoji} size={SIZE} style={{ clipPath: clip[part] }} />;
  const card = 'relative grid place-items-center rounded-[28px] p-[min(1.8vh,1.1vw)]';

  return (
    <GameScreen title="Ghép nửa hình" color="grape" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.halfHint)}>
      <div className="flex min-h-0 flex-1 flex-col justify-around gap-2">
        {/* Nửa hình có sẵn + chỗ trống cho nửa còn lại */}
        <div className="flex justify-center gap-[4vw]">
          {things.map((t) => {
            const full = placed.includes(t.emoji);
            return (
              <button key={t.emoji} data-drop={full ? undefined : t.emoji} data-slot={t.emoji} aria-label={full ? t.name : 'Nửa hình'}
                onClick={() => full && say(t.name)}
                className={`${card} border-4 transition-colors ${full ? 'border-leaf/60 bg-leaf/10' : dnd.over === t.emoji ? 'border-grape bg-grape/15' : 'border-dashed border-grape/40 bg-white/70'}`}>
                {full ? (
                  <motion.span initial={{ scale: 0.8 }} animate={{ scale: [1.18, 1], rotate: [0, -6, 6, 0] }} className="grid"><Emoji glyph={t.emoji} size={SIZE} /></motion.span>
                ) : <>
                  {half(t, 'a')}
                  <span aria-hidden className={`absolute border-dashed border-grape/50 ${cut === 'v' ? 'inset-y-[10%] left-1/2 border-l-4' : 'inset-x-[10%] top-1/2 border-t-4'}`} />
                </>}
              </button>
            );
          })}
        </div>
        {/* Các nửa để kéo */}
        <div className="flex justify-center gap-[4vw]">
          {pieces.map((t) => {
            const gone = placed.includes(t.emoji);
            return (
              <motion.div key={`${t.emoji}-${bounce?.id === t.emoji ? bounce.k : 0}`}
                animate={bounce?.id === t.emoji ? { x: [0, -10, 10, 0] } : {}}
                onPointerDown={(e) => !gone && dnd.start(e, t, half(t, 'b'))}
                aria-label="Nửa hình" data-piece={gone ? undefined : t.emoji}
                className={`${card} touch-none bg-paper shadow-[0_6px_0_var(--color-line)] ${gone ? 'invisible' : 'cursor-grab'}`}
                style={{ opacity: dnd.dragging?.emoji === t.emoji ? 0.3 : undefined }}>
                {half(t, 'b')}
              </motion.div>
            );
          })}
        </div>
      </div>
      {dnd.ghost}
    </GameScreen>
  );
}
