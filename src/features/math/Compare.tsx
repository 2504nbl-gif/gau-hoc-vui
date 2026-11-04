import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Scatter } from '@/components/game/ChoiceGame';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import { NUMBER_WORDS, PHRASES } from '@/data/phrases';
import { preloadVoice, say, sayAll } from '@/services/audio/voice';
import { feedbackWrong } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

type Sign = '<' | '>' | '=';
const SIGN_WORD: Record<Sign, string> = { '>': PHRASES.bigger, '<': PHRASES.smaller, '=': PHRASES.equal };
const EMOJIS = ['🍎', '🐟', '⭐', '🎈', '🐥', '🍓'];
const ROUNDS = 6;

/** So sánh: đếm hai nhóm, kéo dấu >, <, = vào ô trống ở giữa. */
export function Compare({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'compare', rounds: ROUNDS });
  const q = useMemo(() => {
    const a = 1 + Math.floor(Math.random() * 7);
    const b = s.round % 3 === 2 ? a : 1 + Math.floor(Math.random() * 7); // thỉnh thoảng bằng nhau
    return { a, b, emoji: EMOJIS[s.round % EMOJIS.length], sign: (a > b ? '>' : a < b ? '<' : '=') as Sign };
  }, [s.round, s.game]);
  const [placed, setPlaced] = useState<Sign | null>(null);

  useEffect(() => {
    setPlaced(null);
    preloadVoice([PHRASES.compareHint, ...Object.values(SIGN_WORD), ...NUMBER_WORDS], 'vi').then(() => say(PHRASES.compareHint));
  }, [q]);

  const dnd = useDragDrop<Sign>(async (sign, zone) => {
    if (zone !== 'slot' || placed) return;
    if (sign !== q.sign) { s.miss(); feedbackWrong(); return; }
    setPlaced(sign);
    sfx.correct();
    await sayAll([NUMBER_WORDS[q.a], SIGN_WORD[sign], NUMBER_WORDS[q.b]]).done;
    setTimeout(s.win, 500);
  }, { accept: (sign, zone) => zone === 'slot' && !placed && sign === q.sign });

  const Tile = ({ sign }: { sign: Sign }) => (
    <span className="grid size-[min(15vh,90px)] place-items-center rounded-3xl bg-sun font-display font-extrabold text-white shadow-[0_5px_0_#b07c18]" style={{ fontSize: 'min(10vh,60px)' }}>{sign}</span>
  );

  return (
    <GameScreen title="So sánh" color="sun" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.compareHint)}>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-[3vw]">
        {[q.a, q.b].map((n, i) => (
          <div key={i} className={`flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-[28px] bg-paper p-3 shadow-[0_5px_0_var(--color-line)] ${i ? 'order-3' : 'order-1'}`}>
            <Scatter emoji={q.emoji} n={n} size="min(8vh, 5vw)" />
            <span className="font-display text-4xl font-extrabold text-berry">{n}</span>
          </div>
        ))}
        <div data-drop="slot" className="order-2 grid size-[min(17vh,104px)] flex-none place-items-center rounded-3xl border-4 border-dashed border-sun bg-sun/10">
          {placed && <motion.span initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}><Tile sign={placed} /></motion.span>}
        </div>
      </div>
      <div className="flex justify-center gap-4">
        {(['<', '=', '>'] as Sign[]).map((sg) => (
          <div key={sg} className="cursor-grab touch-none" onPointerDown={(e) => !placed && dnd.start(e, sg, <Tile sign={sg} />)}><Tile sign={sg} /></div>
        ))}
      </div>
      {dnd.ghost}
    </GameScreen>
  );
}
