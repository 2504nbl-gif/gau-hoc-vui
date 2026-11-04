import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';
import { INGREDIENTS, SCOOPS, type Layer } from '@/data/cognitive';
import { Emoji } from '@/components/content/Emoji';

type Recipe = { kind: 'sandwich' | 'icecream'; layers: Layer[] };

function makeRecipe(i: number): Recipe {
  if (i % 2 === 0) {
    const bread = INGREDIENTS[0];
    const fillings = shuffle(INGREDIENTS.slice(1)).slice(0, i < 2 ? 2 : 3);
    return { kind: 'sandwich', layers: [bread, ...fillings, bread] };
  }
  const scoops = shuffle(SCOOPS.slice(0, 4)).slice(0, i < 2 ? 2 : 3);
  return { kind: 'icecream', layers: [...scoops, SCOOPS[4]] };
}

/** Vẽ một chồng lớp (từ dưới lên). */
function Stack({ recipe, count, scale = 1 }: { recipe: Recipe; count: number; scale?: number }) {
  const u = `calc(min(2.2vh, 1.6vw) * ${scale})`;
  return (
    <div className="flex flex-col-reverse items-center">
      {recipe.kind === 'icecream' && (
        <div style={{ width: `calc(${u} * 12)`, height: `calc(${u} * 14)`, clipPath: 'polygon(0 0, 100% 0, 50% 100%)', background: 'repeating-linear-gradient(45deg,#d99a4e 0 8px,#c4823a 8px 16px)' }} />
      )}
      <AnimatePresence>
        {recipe.layers.slice(0, count).map((l, i) => (
          <motion.div key={i} initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="grid place-items-center border-2 border-black/10 shadow-sm"
            style={{
              background: l.color,
              height: `calc(${u} * ${l.h})`,
              width: `calc(${u} * ${(l.w ?? (recipe.kind === 'icecream' ? 15 : 22)) / (l.w ? 2 : 1)})`,
              borderRadius: l.round ? '999px 999px 40% 40%' : i === 0 && l.id === 'bread' ? '8px 8px 18px 18px' : '14px',
              marginBottom: recipe.kind === 'icecream' && i > 0 ? `calc(${u} * -1.4)` : 0,
              zIndex: i,
            }}>
            <Emoji glyph={l.emoji} size={`calc(${u} * 1.6)`} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const ROUNDS = 4;

/** Làm theo mẫu: bé chọn nguyên liệu theo đúng thứ tự từ dưới lên giống hình mẫu. */
export function SequenceGame({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'sequence', rounds: ROUNDS });
  const recipe = useMemo(() => makeRecipe(s.round), [s.round, s.game]);
  const tray = useMemo(() => {
    const pool = recipe.kind === 'sandwich' ? INGREDIENTS : SCOOPS;
    return shuffle(pool);
  }, [recipe]);
  const [built, setBuilt] = useState(0);
  const [wrong, setWrong] = useState<{ id: string; k: number } | null>(null);

  useEffect(() => {
    setBuilt(0);
    preloadVoice([PHRASES.sequenceHint, ...INGREDIENTS.map((x) => x.name), ...SCOOPS.map((x) => x.name)], 'vi').then(() => say(PHRASES.sequenceHint));
  }, [recipe]);

  const tap = async (l: Layer) => {
    if (built >= recipe.layers.length) return;
    if (recipe.layers[built].id !== l.id) { s.miss(); setWrong({ id: l.id, k: Date.now() }); feedbackWrong(l.name); return; }
    sfx.pop();
    const n = built + 1;
    setBuilt(n);
    if (n < recipe.layers.length) { say(l.name); return; }
    await feedbackCorrect().done;
    setTimeout(s.win, 500);
  };

  return (
    <GameScreen title={recipe.kind === 'sandwich' ? 'Làm bánh mì kẹp' : 'Làm kem ốc quế'} color="teal" session={s} rounds={ROUNDS}
      onExit={onExit} onReplay={() => say(PHRASES.sequenceHint)}>
      <div className="flex min-h-0 flex-1 items-end justify-around gap-4 rounded-[28px] bg-paper p-4 shadow-[0_5px_0_var(--color-line)]">
        <div className="flex flex-col items-center gap-2">
          <span className="rounded-full bg-cloud px-3 py-1 text-sm font-extrabold text-soft">Hình mẫu</span>
          <Stack recipe={recipe} count={recipe.layers.length} scale={0.8} />
        </div>
        <div className="text-5xl text-line" aria-hidden>➜</div>
        <div className="flex flex-col items-center gap-2">
          <span className="rounded-full bg-teal/15 px-3 py-1 text-sm font-extrabold text-teal">Của bé</span>
          <div className="flex min-h-[20vh] items-end">
            {built === 0 && recipe.kind === 'sandwich' ? <Emoji glyph="🍽️" className="mb-2 text-5xl opacity-30" /> : <Stack recipe={recipe} count={built} />}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {tray.map((l) => (
          <motion.button key={`${l.id}-${wrong?.id === l.id ? wrong.k : 0}`} onClick={() => tap(l)} aria-label={l.name}
            animate={wrong?.id === l.id ? { x: [0, -10, 10, 0] } : {}} whileTap={{ scale: 0.9 }}
            className="grid size-[min(15vh,90px)] place-items-center rounded-3xl border-4 bg-paper shadow-[0_5px_0_var(--color-line)]"
            style={{ borderColor: l.color }}>
            <Emoji glyph={l.emoji} size="min(8vh,48px)" />
          </motion.button>
        ))}
      </div>
    </GameScreen>
  );
}
