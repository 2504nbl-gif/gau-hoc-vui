import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Emoji } from '@/components/content/Emoji';
import { CardVisual } from '@/components/content/CardVisual';
import { BigNumber } from '@/components/game/ChoiceGame';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { burst } from '@/components/game/Fireworks';
import { COUNT_ROUNDS, COUNT_THINGS } from '@/data/early';
import { NUMBER_WORDS, PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say, sayAll } from '@/services/audio/voice';
import { feedbackWrong } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

const ROUNDS = COUNT_ROUNDS.length;
const THING = 'min(22vh, 12vw)';
const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

/**
 * Đếm và chọn số: bé chạm từng vật để đếm (đọc số, vật nảy lên, hiện số thứ tự), đếm hết mới chọn thẻ số.
 * Khác Đếm trứng ở bước chạm-đếm từng vật (đếm tương ứng 1–1) và thẻ chấm ở các vòng đầu.
 */
export function CountTouch({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'count-touch', rounds: ROUNDS });
  const cfg = COUNT_ROUNDS[s.round];
  const deck = useMemo(() => shuffle(COUNT_THINGS).slice(0, ROUNDS), [s.game]);
  const thing = deck[s.round];
  const q = useMemo(() => {
    const n = rnd(cfg.min, cfg.max);
    const set = new Set([n]);
    while (set.size < 3) set.add(rnd(Math.max(1, n - 2), Math.min(5, n + 2)));
    return { n, cards: shuffle([...set]) };
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps
  /** Thứ tự bé đã chạm: counted[k] = vị trí của vật được đếm thứ k+1. */
  const [counted, setCounted] = useState<number[]>([]);
  const [picking, setPicking] = useState(false);
  const [marks, setMarks] = useState<Record<number, 'right' | 'wrong'>>({});
  const live = useRef(0);
  const busy = useRef(false);

  const ask = () => say(picking ? PHRASES.countPickHint : PHRASES.countTouchHint);

  useEffect(() => {
    const id = ++live.current;
    busy.current = false;
    setCounted([]);
    setPicking(false);
    setMarks({});
    preloadVoice([PHRASES.countTouchHint, PHRASES.countPickHint, PHRASES.correct, PHRASES.tryAgain, ...NUMBER_WORDS, ...deck.map((x) => x.name)], 'vi')
      .then(() => { if (live.current === id) say(PHRASES.countTouchHint); });
    return () => { live.current++; };
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps

  const touch = async (i: number) => {
    const at = counted.indexOf(i);
    if (at >= 0) { sfx.tap(); say(NUMBER_WORDS[at + 1]); return; } // đã đếm rồi: đọc lại số của bạn ấy
    const id = live.current;
    const k = counted.length + 1;
    setCounted([...counted, i]);
    sfx.pop();
    await say(NUMBER_WORDS[k]).done;
    if (k < q.n || live.current !== id) return;
    setPicking(true);
    say(PHRASES.countPickHint);
  };

  const pick = async (k: number) => {
    if (busy.current || marks[k]) return;
    if (!picking) { say(PHRASES.countTouchHint); return; } // chưa đếm xong thì nhắc đếm tiếp
    if (k !== q.n) {
      s.miss();
      setMarks((m) => ({ ...m, [k]: 'wrong' }));
      feedbackWrong(NUMBER_WORDS[k]);
      return;
    }
    busy.current = true;
    setMarks((m) => ({ ...m, [k]: 'right' }));
    sfx.correct();
    burst();
    await sayAll([PHRASES.correct, NUMBER_WORDS[k], thing.name]).done; // "Đúng rồi! Ba · Quả táo"
    setTimeout(s.win, 300);
  };

  return (
    <GameScreen title="Đếm và chọn số" color="sea" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => ask()}>
      <div className="flex min-h-0 flex-[1.15] items-center justify-center gap-[2vw] rounded-[28px] bg-paper p-3 shadow-[0_5px_0_var(--color-line)]">
        {Array.from({ length: q.n }, (_, i) => {
          const at = counted.indexOf(i);
          return (
            <motion.button key={`${s.game}-${s.round}-${i}`} aria-label={thing.name} data-count={at >= 0 ? 'done' : 'todo'} onClick={() => touch(i)}
              initial={{ scale: 0 }} animate={at >= 0 ? { scale: 1, y: [0, -26, 0, -8, 0] } : { scale: 1, y: 0 }}
              transition={{ duration: 0.5, scale: { type: 'spring', bounce: 0.5, delay: at >= 0 ? 0 : i * 0.08 } }} whileTap={{ scale: 0.92 }}
              className="relative grid place-items-center leading-none">
              <Emoji glyph={thing.emoji} size={THING} />
              {at >= 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }}
                  className="absolute -bottom-[4%] left-1/2 -ml-[min(4vh,2.5vw)] grid size-[min(8vh,5vw)] place-items-center rounded-full border-[3px] border-white bg-sea font-display font-extrabold text-white shadow-[0_3px_0_#2f78c4]"
                  style={{ fontSize: 'min(5vh, 3.2vw)' }}>{at + 1}</motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
      <div className={`grid min-h-0 flex-1 grid-cols-3 gap-[2.5vw] transition-opacity duration-300 ${picking ? '' : 'opacity-40'}`}>
        {q.cards.map((k) => {
          const m = marks[k];
          return (
            <motion.button key={`${s.game}-${s.round}-${k}`} aria-label={NUMBER_WORDS[k]} data-card={k} data-ok={k === q.n ? '' : undefined} onClick={() => pick(k)}
              animate={m === 'wrong' ? { x: [0, -12, 12, -8, 8, 0] } : m === 'right' ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.45 }}
              whileTap={{ scale: 0.95 }}
              className={`flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-[26px] border-4 bg-paper p-2 shadow-[0_6px_0_var(--color-line)] ${
                m === 'right' ? 'border-leaf' : m === 'wrong' ? 'border-berry/50 opacity-60' : 'border-transparent'}`}>
              {cfg.card === 'dots' ? <CardVisual visual={{ kind: 'dots', count: k }} size="min(17vh, 12vw)" /> : <BigNumber n={k} />}
            </motion.button>
          );
        })}
      </div>
    </GameScreen>
  );
}
