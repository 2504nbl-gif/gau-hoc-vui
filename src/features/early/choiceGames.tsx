// Ba trò ngôn ngữ / cảm xúc cho bé 3 tuổi, dựng trên ChoiceGame: Ở đâu thế?, Trái ngược, Bạn thấy thế nào?
// Số lựa chọn tăng dần theo vòng (2 → 3 → 4).
import { motion } from 'motion/react';
import { ChoiceGame, type ChoiceRound } from '@/components/game/ChoiceGame';
import { Emoji } from '@/components/content/Emoji';
import { FEELINGS, OPPOSITES, PLACES, SITUATIONS, type FeelingId, type OppositeSide } from '@/data/early';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { say } from '@/services/audio/voice';
import type { GameProps } from '@/features/registry';
import { OppositePicture, PlaceScene } from './art';

const ROUNDS = 5;
const POP = { type: 'spring', bounce: 0.5 } as const;

/** Từ chỉ vị trí: nghe "Gấu ở trên bàn", chọn đúng tranh. Vòng cuối cả 3 tranh cùng một đồ vật, chỉ khác vị trí. */
export function WhereBear({ onExit }: GameProps) {
  let order = PLACES;
  return (
    <ChoiceGame title="Ở đâu thế?" color="leaf" resultId="where-bear" rounds={ROUNDS} onExit={onExit}
      make={(i): ChoiceRound => {
        if (i === 0) order = shuffle(PLACES);
        const target = order[i];
        const same = shuffle(PLACES.filter((p) => p.id !== target.id && p.furniture === target.furniture));
        const other = shuffle(PLACES.filter((p) => p.furniture !== target.furniture));
        const wrong = i < 2 ? [other[0]] : i < 4 ? [same[0], other[0]] : same;
        return {
          say: [PHRASES.find, target.name], // "Bé tìm · Gấu ở trên bàn"
          choices: shuffle([target, ...wrong]).map((p) => ({ id: p.id, ok: p.id === target.id, name: p.name, node: <PlaceScene place={p} /> })),
        };
      }} />
  );
}

/** Trái ngược: cô nói một từ kèm hình ("To"), bé chọn hình trái ngược ("Nhỏ"). */
export function Opposites({ onExit }: GameProps) {
  let order = OPPOSITES;
  return (
    <ChoiceGame title="Trái ngược" color="berry" resultId="opposites" rounds={ROUNDS} onExit={onExit}
      preload={OPPOSITES.flatMap((o) => [o.a.name, o.b.name])}
      make={(i): ChoiceRound => {
        if (i === 0) order = shuffle(OPPOSITES);
        const pair = order[i];
        const [shown, answer] = shuffle([pair.a, pair.b]);
        const wrong = shuffle(OPPOSITES.filter((o) => o.id !== pair.id)).slice(0, i < 2 ? 1 : 2).map((o) => shuffle([o.a, o.b])[0]);
        const choice = (x: OppositeSide) => ({ id: x.name, ok: x === answer, name: x.name, node: <OppositePicture art={x.art} size="min(24vh, 16vw)" /> });
        return {
          say: [PHRASES.oppositePre, shown.name, PHRASES.oppositePost], // "Trái ngược với · To · là gì nhỉ?"
          stage: (
            <motion.button key={shown.name} aria-label={shown.name} onClick={() => say(shown.name)}
              initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={POP} whileTap={{ scale: 0.92 }}
              className="flex h-full items-center justify-center gap-[2vw] leading-none">
              <OppositePicture art={shown.art} size="min(30vh, 20vw)" />
              <span className="font-display font-extrabold text-berry" style={{ fontSize: 'min(11vh, 7vw)' }}>↔</span>
              <span className="grid place-items-center rounded-[22px] border-4 border-dashed border-berry/40 font-display font-extrabold text-berry/60"
                style={{ width: 'min(24vh, 16vw)', height: 'min(24vh, 16vw)', fontSize: 'min(14vh, 9vw)' }}>?</span>
            </motion.button>
          ),
          choices: shuffle([answer, ...wrong]).map(choice),
        };
      }} />
  );
}

const FEELING_IDS = Object.keys(FEELINGS) as FeelingId[];

/** Cảm xúc: nghe tình huống của bạn gấu, chọn khuôn mặt phù hợp; đúng thì cô gọi tên cảm xúc ("Bạn gấu vui quá!"). */
export function HowFeel({ onExit }: GameProps) {
  let order = SITUATIONS.slice(0, ROUNDS);
  return (
    <ChoiceGame title="Bạn thấy thế nào?" color="sun" resultId="how-feel" rounds={ROUNDS} onExit={onExit}
      preload={FEELING_IDS.flatMap((f) => [FEELINGS[f].named, FEELINGS[f].name])}
      make={(i): ChoiceRound => {
        // Mỗi cảm xúc một tình huống, thứ tự xáo trộn.
        if (i === 0) order = shuffle(FEELING_IDS).map((f) => shuffle(SITUATIONS.filter((x) => x.feeling === f))[0]);
        const sit = order[i];
        const wrong = shuffle(FEELING_IDS.filter((f) => f !== sit.feeling)).slice(0, i < 2 ? 1 : i < 3 ? 2 : 3);
        return {
          say: [sit.text, PHRASES.feelAsk],
          answerName: FEELINGS[sit.feeling].named,
          stage: (
            <div key={sit.text} className="flex items-center justify-center gap-[3vw]" style={{ fontSize: 'min(24vh, 15vw)' }}>
              <motion.button aria-label="Con gấu" onClick={() => say('Con gấu')} className="leading-none"
                initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={POP} whileTap={{ scale: 0.9 }}>
                <Emoji glyph="🐻" />
              </motion.button>
              {sit.props.map((p, k) => (
                <motion.button key={p.emoji} aria-label={p.name} onClick={() => say(p.name)} className="leading-none" style={{ fontSize: '.8em' }}
                  initial={{ scale: 0, rotate: 0 }} animate={{ scale: 1, rotate: sit.flip ? 150 : 0 }} transition={{ ...POP, delay: 0.25 + k * 0.15 }}
                  whileTap={{ scale: 0.9 }}>
                  <Emoji glyph={p.emoji} />
                </motion.button>
              ))}
            </div>
          ),
          choices: shuffle([sit.feeling, ...wrong]).map((f) => ({
            id: f, ok: f === sit.feeling, name: FEELINGS[f].name, node: <Emoji glyph={FEELINGS[f].emoji} size="min(24vh, 15vw)" />,
          })),
        };
      }} />
  );
}
