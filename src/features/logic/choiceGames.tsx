// Hai trò "nhìn → chọn" của nhóm Phát triển tư duy, dựng trên ChoiceGame: Tìm bạn khác loại, Hình gì tiếp theo?
import type { CSSProperties } from 'react';
import { motion } from 'motion/react';
import { ChoiceGame, type Choice } from '@/components/game/ChoiceGame';
import { CardVisual } from '@/components/content/CardVisual';
import { getTopic } from '@/data';
import { ODD_COLORS, ODD_TOPIC_IDS, PATTERN_COLORS, PATTERN_ROUNDS } from '@/data/logic';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import type { ShapeId, Visual } from '@/types/content';
import type { GameProps } from '@/features/registry';

interface Token { visual: Visual; name: string }
const topicTokens = (id: string): Token[] => getTopic(id)!.items.map((i) => ({ visual: i.visual, name: i.label.vi }));

const ODD_SIZE = 'min(30vh, 15vw)';
const ODD_SHAPES: ShapeId[] = ['circle', 'square', 'triangle', 'star', 'heart'];

/** 4 thẻ: 3 thẻ `same` và 1 thẻ `odd` (đáp án), xáo vị trí. `style` chỉ áp cho thẻ khác. */
function oddChoices(same: Token[], odd: Token, style?: CSSProperties): Choice[] {
  const cell = (t: Token, s?: CSSProperties) => (
    <span className="grid place-items-center transition-transform" style={s}><CardVisual visual={t.visual} size={ODD_SIZE} /></span>
  );
  return shuffle([
    ...same.map((t) => ({ node: cell(t), ok: false, name: t.name })),
    { node: cell(odd, style), ok: true, name: odd.name },
  ]).map((c, i) => ({ ...c, id: String(i) }));
}

/**
 * Quan sát: 4 hình, tìm bạn khác với 3 bạn còn lại. Khó dần theo lượt:
 * khác màu → khác nhóm (2 lượt) → khác cỡ → khác hướng (lộn ngược).
 */
export function OddOneOut({ onExit }: GameProps) {
  return (
    <ChoiceGame title="Tìm bạn khác loại" color="teal" resultId="odd-one-out" rounds={5} onExit={onExit}
      make={(i) => {
        const say = [PHRASES.oddHint];
        if (i === 0) {
          const [a, b] = shuffle(ODD_COLORS);
          const shape = shuffle(ODD_SHAPES)[0];
          const tok = (c: typeof a): Token => ({ visual: { kind: 'shape', shape, color: c.hex }, name: c.name });
          return { say, choices: oddChoices([tok(a), tok(a), tok(a)], tok(b)) };
        }
        if (i <= 2) {
          const [ta, tb] = shuffle(ODD_TOPIC_IDS);
          return { say, choices: oddChoices(shuffle(topicTokens(ta)).slice(0, 3), shuffle(topicTokens(tb))[0]) };
        }
        const t = shuffle(topicTokens(i === 3 ? 'fruits' : 'pets'))[0];
        return { say, choices: oddChoices([t, t, t], t, i === 3 ? { transform: 'scale(.5)' } : { transform: 'rotate(180deg)' }) };
      }} />
  );
}

const SEQ_SIZE = 'min(15vh, 9vw)';

/** Dải hình xếp theo quy luật, ô cuối là dấu hỏi. */
function PatternRow({ tokens }: { tokens: Token[] }) {
  return (
    <div className="flex items-center justify-center gap-[1.6vw]">
      {tokens.map((t, k) => (
        <motion.span key={k} initial={{ scale: 0, y: 12 }} animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.15 + k * 0.22, type: 'spring', stiffness: 380, damping: 16 }}
          className="grid place-items-center">
          <CardVisual visual={t.visual} size={SEQ_SIZE} />
        </motion.span>
      ))}
      <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}
        className="grid place-items-center rounded-[24%] border-4 border-dashed border-grape/60 bg-grape/10 font-display font-extrabold text-grape"
        style={{ width: `calc(${SEQ_SIZE} * 1.15)`, height: `calc(${SEQ_SIZE} * 1.15)`, fontSize: `calc(${SEQ_SIZE} * .7)`, lineHeight: 1 }}>
        ?
      </motion.span>
    </div>
  );
}

/**
 * Quan sát: chuỗi lặp AB → AAB → ABB → ABC, bé chọn hình tiếp theo. Cô đọc cả chuỗi theo nhịp
 * ("Đỏ, Xanh, Đỏ, Xanh…") rồi hỏi "Tiếp theo là hình gì nhỉ?".
 */
export function PatternNext({ onExit }: GameProps) {
  return (
    <ChoiceGame title="Hình gì tiếp theo?" color="grape" resultId="pattern-next" rounds={PATTERN_ROUNDS.length} onExit={onExit}
      make={(i) => {
        const r = PATTERN_ROUNDS[i];
        const pool: Token[] = r.colors
          ? PATTERN_COLORS.map((c) => ({ visual: { kind: 'shape', shape: 'circle', color: c.hex }, name: c.name }))
          : topicTokens(['fruits', 'pets', 'vehicles', 'toys'][i % 4]);
        const picked = shuffle(pool).slice(0, 3);
        const by: Record<string, Token> = { A: picked[0], B: picked[1], C: picked[2] };
        const shown = [...r.shown].map((ch) => by[ch]);
        const answer = by[r.answer];
        return {
          say: [...shown.map((t) => t.name), PHRASES.patternNext],
          stage: <PatternRow tokens={shown} />,
          choices: shuffle(picked.slice(0, r.choices)).map((t, k) => ({
            id: String(k), ok: t === answer, name: t.name,
            node: <CardVisual visual={t.visual} size="min(22vh, 14vw)" />,
          })),
        };
      }} />
  );
}
