// Các trò "câu hỏi → chọn đáp án" dựng trên ChoiceGame: chỉ cần mô tả từng lượt.
import { BigNumber, ChoiceGame, Scatter, type ChoiceRound } from '@/components/game/ChoiceGame';
import { CardVisual } from '@/components/content/CardVisual';
import { getTopic } from '@/data';
import { NUMBER_WORDS, PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { SOUNDS } from '@/services/audio/soundBank';
import type { GameProps } from '@/features/registry';
import { Emoji } from '@/components/content/Emoji';

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

/** 3 số khác nhau gồm đáp án đúng, nằm trong [min, max]. */
function numberChoices(answer: number, min = 0, max = 10) {
  const set = new Set([answer]);
  while (set.size < 3) set.add(Math.max(min, Math.min(max, answer + rnd(-3, 3))));
  return shuffle([...set]).map((n) => ({ id: String(n), node: <BigNumber n={n} />, ok: n === answer, name: NUMBER_WORDS[n] }));
}

const COUNTABLE = ['pets', 'fruits', 'sea', 'toys'];

/** Quan sát: đếm số lượng vật, có vài vật bị lá che một nửa. */
export function HiddenCount({ onExit }: GameProps) {
  return (
    <ChoiceGame title="Đếm vật ẩn" color="teal" resultId="hidden-count" rounds={6} onExit={onExit}
      preload={NUMBER_WORDS}
      make={(i) => {
        const item = shuffle(getTopic(COUNTABLE[i % COUNTABLE.length])!.items)[0];
        const n = rnd(i < 2 ? 1 : 3, i < 2 ? 4 : 8);
        const emoji = item.visual.kind === 'emoji' ? item.visual.value : '⭐';
        return {
          say: [PHRASES.howMany, item.label.vi],
          stage: <Scatter emoji={emoji} n={n} hidden={i < 2 ? 0 : rnd(1, Math.min(3, n))} />,
          choices: numberChoices(n, 1, 10),
        };
      }} />
  );
}

/** Toán: đếm trứng trong ổ. */
export function EggCount({ onExit }: GameProps) {
  return (
    <ChoiceGame title="Đếm trứng" color="sun" resultId="egg-count" rounds={6} onExit={onExit} preload={NUMBER_WORDS}
      make={(i) => {
        const n = rnd(1, i < 3 ? 5 : 9);
        return {
          say: [PHRASES.eggsHint],
          stage: (
            <div className="flex flex-col items-center">
              <Scatter emoji="🥚" n={n} />
              <Emoji glyph="🪺" size="min(10vh,7vw)" />
            </div>
          ),
          choices: numberChoices(n, 1, 10),
        };
      }} />
  );
}

/** Toán: điền số còn thiếu trong dãy. */
export function MissingNumber({ onExit }: GameProps) {
  return (
    <ChoiceGame title="Số còn thiếu" color="sun" resultId="missing-number" rounds={6} onExit={onExit} preload={NUMBER_WORDS}
      make={(i) => {
        const len = i < 3 ? 4 : 5;
        const start = rnd(0, 10 - len + 1);
        const seq = Array.from({ length: len }, (_, k) => start + k);
        const hole = rnd(1, len - 1);
        return {
          say: [PHRASES.missingHint],
          stage: (
            <div className="flex flex-wrap items-center justify-center gap-[2vw]">
              {seq.map((n, k) => (
                <span key={k} className={`grid size-[min(16vh,11vw)] place-items-center rounded-3xl font-display font-extrabold ${k === hole ? 'border-4 border-dashed border-sun bg-sun/10 text-sun' : 'bg-cloud text-ink'}`}
                  style={{ fontSize: 'min(10vh,7vw)' }}>{k === hole ? '?' : n}</span>
              ))}
            </div>
          ),
          choices: numberChoices(seq[hole], 0, 10),
        };
      }} />
  );
}

/** Toán: chọn chậu có đúng N bông hoa. `arg` = số cố định (dùng trong bài học số). */
export function FlowerPot({ onExit, arg }: GameProps) {
  const fixed = arg !== undefined ? Number(arg) : null;
  return (
    <ChoiceGame title={fixed !== null ? `Số ${fixed} · Luyện tập` : 'Chọn chậu hoa'} color="sun" resultId={`flower-pot${fixed ?? ''}`} rounds={fixed !== null ? 3 : 6}
      onExit={onExit} preload={[PHRASES.potHint, PHRASES.flowers, ...NUMBER_WORDS]}
      make={() => {
        const n = fixed ?? rnd(1, 9);
        const set = new Set([n]);
        while (set.size < 3) set.add(Math.max(fixed === 0 ? 0 : 1, Math.min(10, n + rnd(-3, 3))));
        return {
          say: [PHRASES.potHint, NUMBER_WORDS[n], PHRASES.flowers],
          choices: shuffle([...set]).map((k) => ({
            id: String(k), ok: k === n, name: `${NUMBER_WORDS[k]}`,
            node: (
              <div className="flex flex-col items-center">
                <div className="flex max-w-[90%] flex-wrap justify-center leading-none" style={{ fontSize: 'min(6vh,4vw)' }}>{Array.from({ length: k }, (_, j) => <Emoji key={j} glyph="🌷" />)}{k === 0 && ' '}</div>
                <Emoji glyph="🪴" size="min(12vh,8vw)" />
              </div>
            ),
          })),
        };
      }} />
  );
}

/** Âm nhạc: nghe âm thanh, chọn đúng hình phát ra tiếng đó. */
export function SoundQuiz({ onExit }: GameProps) {
  const order = shuffle(SOUNDS);
  return (
    <ChoiceGame title="Tiếng gì đây?" color="sky" resultId="sound-quiz" rounds={6} onExit={onExit}
      make={(i): ChoiceRound => {
        const target = order[i % order.length];
        const others = shuffle(SOUNDS.filter((x) => x.id !== target.id)).slice(0, 2);
        return {
          say: [PHRASES.listenSound],
          sound: target.play,
          choices: shuffle([target, ...others]).map((x) => ({
            id: x.id, ok: x.id === target.id, name: x.name,
            node: <CardVisual visual={{ kind: 'emoji', value: x.icon }} size="min(22vh, 15vw)" />,
          })),
        };
      }} />
  );
}
