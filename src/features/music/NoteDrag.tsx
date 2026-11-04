import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { NOTE_LABEL, sfx } from '@/services/audio/sfx';
import { preloadVoice, sayAll } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import type { NoteName } from '@/types/curriculum';
import type { GameProps } from '@/features/registry';
import { NOTE_COLOR, NOTES, PianoKeys } from './PianoKeys';

const ROUNDS = 6;

/** Nhân vật nốt nhạc: hình tròn có mặt cười, cùng màu với phím. */
function NoteBuddy({ n, size = 'min(18vh, 110px)' }: { n: NoteName; size?: string }) {
  return (
    <div className="relative grid place-items-center rounded-full border-4 border-white shadow-lg" style={{ width: size, height: size, background: NOTE_COLOR[n] }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0"><circle cx="36" cy="40" r="6" fill="#fff" /><circle cx="64" cy="40" r="6" fill="#fff" /><circle cx="37" cy="41" r="3" fill="#2b3a4f" /><circle cx="65" cy="41" r="3" fill="#2b3a4f" /><path d="M36 62 Q50 74 64 62" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" /></svg>
      <span className="absolute -bottom-2 rounded-full bg-white px-2 font-display text-lg font-extrabold" style={{ color: NOTE_COLOR[n] }}>{NOTE_LABEL[n]}</span>
    </div>
  );
}

/** Kéo nốt nhạc: cô gọi "Bé đặt nốt Mi lên đúng phím nhé!", bé kéo bạn nốt nhạc thả vào phím cùng tên, cùng màu. */
export function NoteDrag({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'piano-drag', rounds: ROUNDS });
  const order = useMemo(() => shuffle(NOTES.slice(0, 7)).slice(0, ROUNDS), [s.game]);
  const target = order[s.round];
  const ask = () => sayAll([PHRASES.noteHint, NOTE_LABEL[target], PHRASES.onKey]);

  useEffect(() => {
    preloadVoice([PHRASES.noteHint, PHRASES.onKey, ...Object.values(NOTE_LABEL)], 'vi').then(() => ask());
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  const dnd = useDragDrop<NoteName>(async (n, zone) => {
    if (!zone) return;
    sfx.note(zone as NoteName);
    if (zone !== n) { s.miss(); setTimeout(() => feedbackWrong(NOTE_LABEL[zone as NoteName]), 300); return; }
    await new Promise((r) => setTimeout(r, 300));
    await feedbackCorrect(NOTE_LABEL[n]).done;
    setTimeout(s.win, 300);
  }, { accept: (n, zone) => zone === n });

  return (
    <GameScreen title="Kéo nốt nhạc" color="sky" session={s} rounds={ROUNDS} onExit={onExit} onReplay={ask}>
      <div className="flex flex-[0.8] items-center justify-center">
        <motion.div key={`${s.game}-${s.round}`} initial={{ y: -40, opacity: 0 }} animate={{ y: [0, -10, 0], opacity: 1 }}
          transition={{ y: { duration: 1.6, repeat: Infinity } }}
          onPointerDown={(e) => dnd.start(e, target, <NoteBuddy n={target} />)}
          className="cursor-grab touch-none" style={{ opacity: dnd.dragging ? 0.25 : 1 }}>
          <NoteBuddy n={target} />
        </motion.div>
      </div>
      <PianoKeys drop />
      {dnd.ghost}
    </GameScreen>
  );
}
