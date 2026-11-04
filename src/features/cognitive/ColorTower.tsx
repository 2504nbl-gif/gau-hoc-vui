import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { getTopic } from '@/data';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say, sayAll } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

const ROUNDS = 3;

/** Xếp tháp màu: xếp vòng to nhất xuống dưới trước, rồi nhỏ dần. Lượt 1: 3 vòng → lượt 3: 5 vòng. */
export function ColorTower({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'color-tower', rounds: ROUNDS });
  const colors = getTopic('colors')!.items.filter((c) => !['#ffffff', '#222222'].includes((c.visual as { hex: string }).hex));
  const rings = useMemo(() => {
    const n = 3 + s.round;
    return shuffle(colors).slice(0, n).map((c, i) => ({ id: c.id, name: c.label.vi, hex: (c.visual as { hex: string }).hex, size: n - i }));
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps
  const floor = useMemo(() => shuffle(rings), [rings]);
  const [stack, setStack] = useState<string[]>([]);
  const [wrong, setWrong] = useState<{ id: string; k: number } | null>(null);

  useEffect(() => {
    setStack([]);
    preloadVoice([PHRASES.towerHint, PHRASES.towerSmaller, ...colors.map((c) => c.label.vi)], 'vi').then(() => say(PHRASES.towerHint));
  }, [rings]); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = async (r: (typeof rings)[number]) => {
    if (stack.includes(r.id)) return;
    const need = rings.find((x) => !stack.includes(x.id))!; // vòng to nhất còn lại
    if (r.id !== need.id) { s.miss(); setWrong({ id: r.id, k: Date.now() }); feedbackWrong(); setTimeout(() => say(PHRASES.towerSmaller), 900); return; }
    sfx.pop();
    const next = [...stack, r.id];
    setStack(next);
    if (next.length < rings.length) { say(r.name); return; }
    await sayAll([r.name]).done;
    await feedbackCorrect().done;
    setTimeout(s.win, 400);
  };

  const unit = 'min(5vh, 3.4vw)';
  const ringW = (size: number) => `calc(${unit} * ${3 + size * 2.2})`;

  return (
    <GameScreen title="Xếp tháp màu" color="teal" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.towerHint)}>
      <div className="flex min-h-0 flex-1 items-end justify-center gap-6 rounded-[28px] bg-paper p-4 shadow-[0_5px_0_var(--color-line)]">
        {/* Cột tháp */}
        <div className="relative flex flex-col-reverse items-center" style={{ minHeight: `calc(${unit} * ${rings.length * 1.3 + 2})` }}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full bg-[#b07a4a]" style={{ width: `calc(${unit} * .6)`, height: `calc(${unit} * ${rings.length * 1.3 + 2})` }} />
          <div className="relative z-10 rounded-xl bg-[#8b5a2b]" style={{ width: ringW(rings.length + 0.6), height: `calc(${unit} * .7)` }} />
          {stack.map((id) => {
            const r = rings.find((x) => x.id === id)!;
            return (
              <motion.div key={id} initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="relative z-10 rounded-full border-2 border-black/10" style={{ width: ringW(r.size), height: `calc(${unit} * 1.3)`, background: r.hex }} />
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-center gap-3">
        {floor.map((r) => (
          <motion.button key={`${r.id}-${wrong?.id === r.id ? wrong.k : 0}`} aria-label={r.name} onClick={() => tap(r)}
            animate={wrong?.id === r.id ? { x: [0, -10, 10, 0] } : { opacity: stack.includes(r.id) ? 0.15 : 1 }}
            whileTap={{ scale: 0.92 }}
            className="rounded-full border-2 border-black/10 shadow-[0_4px_0_rgba(0,0,0,.15)]"
            style={{ width: ringW(r.size), height: `calc(${unit} * 1.5)`, background: r.hex }} />
        ))}
      </div>
    </GameScreen>
  );
}
