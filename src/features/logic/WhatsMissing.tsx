import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CardVisual } from '@/components/content/CardVisual';
import { ChoiceCard } from '@/components/game/ChoiceCard';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { getTopic } from '@/data';
import { MISSING_TOPIC_IDS } from '@/data/logic';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say, sayAll } from '@/services/audio/voice';
import { feedbackCorrect, feedbackWrong } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { VocabItem } from '@/types/content';
import type { GameProps } from '@/features/registry';

/** Số hình mỗi lượt; 2 lượt cuối các bạn còn lại còn đổi chỗ sau khi che. */
const COUNTS = [3, 3, 4, 4, 4];
const ROUNDS = COUNTS.length;
const SIZE = 'min(21vh, 12vw)';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** look = cho bé nhìn · hide = úp thẻ · ask = mở lại, thiếu một bạn · found = bé tìm ra */
type Phase = 'look' | 'hide' | 'ask' | 'found';

/** Ghi nhớ: nhìn 3–4 hình, thẻ úp lại, một hình trốn mất — bé chọn hình đã biến mất trong 3 lựa chọn. */
export function WhatsMissing({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'whats-missing', rounds: ROUNDS });
  const mix = s.round >= 3;
  const { shown, gone, after, choices } = useMemo(() => {
    const items = shuffle(getTopic(shuffle(MISSING_TOPIC_IDS)[0])!.items);
    const shown = items.slice(0, COUNTS[s.round]);
    const gone = shuffle(shown)[0];
    const rest = shown.filter((x) => x !== gone);
    return {
      shown, gone,
      /** Hàng thẻ sau khi mở lại; null là chỗ trống của bạn đã trốn. */
      after: (mix ? [...shuffle(rest), null] : shown.map((x) => (x === gone ? null : x))) as (VocabItem | null)[],
      choices: shuffle([gone, ...items.slice(COUNTS[s.round], COUNTS[s.round] + 2)]),
    };
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps
  const [phase, setPhase] = useState<Phase>('look');
  const [wrong, setWrong] = useState<Record<string, number>>({});

  useEffect(() => {
    let off = false;
    setPhase('look'); setWrong({});
    void (async () => {
      const names = shown.map((x) => x.label.vi);
      await preloadVoice([PHRASES.missLook, PHRASES.missAsk, ...names, ...choices.map((c) => c.label.vi)], 'vi');
      if (off) return;
      const t0 = Date.now();
      await sayAll([PHRASES.missLook, ...names]).done;
      await wait(Math.max(1200, 3400 - (Date.now() - t0)));
      if (off) return;
      setPhase('hide'); sfx.flip();
      await wait(1300);
      if (off) return;
      setPhase('ask'); sfx.flip();
      say(PHRASES.missAsk);
    })();
    return () => { off = true; };
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = async (it: VocabItem) => {
    if (phase !== 'ask') return;
    if (it !== gone) { s.miss(); setWrong((w) => ({ ...w, [it.id]: Date.now() })); feedbackWrong(it.label.vi); return; }
    setPhase('found');
    await feedbackCorrect(it.label.vi).done;
    setTimeout(s.win, 500);
  };

  const row = phase === 'look' || phase === 'hide' ? shown : after;
  const asking = phase === 'ask' || phase === 'found';

  return (
    <GameScreen title="Thiếu bạn nào?" color="coral" session={s} rounds={ROUNDS} onExit={onExit}
      onReplay={() => say(asking ? PHRASES.missAsk : PHRASES.missLook)}>
      <div className="flex min-h-0 flex-[1.1] items-center justify-center gap-[2.5vw] rounded-[28px] bg-paper p-3 shadow-[0_5px_0_var(--color-line)]" data-phase={phase}>
        {row.map((it, i) => {
          const hole = it === null;
          const item = hole ? gone : it;
          const faceDown = phase === 'hide';
          return (
            <motion.div key={hole ? 'hole' : item.id} layout initial={{ scale: 0 }} animate={{ scale: 1, rotateY: faceDown ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: phase === 'look' ? i * 0.12 : 0 }}
              onClick={() => !faceDown && !hole && say(item.label.vi)}
              className="relative grid place-items-center rounded-[26px] p-[1.6vh]"
              style={{ transformStyle: 'preserve-3d', background: 'color-mix(in srgb, var(--color-coral) 14%, white)' }}>
              <span className={hole && phase !== 'found' ? 'invisible' : ''} style={{ backfaceVisibility: 'hidden' }}>
                {hole && phase === 'found'
                  ? <motion.span className="block" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 12 }}><CardVisual visual={item.visual} size={SIZE} /></motion.span>
                  : <CardVisual visual={item.visual} size={SIZE} />}
              </span>
              {hole && phase !== 'found' && (
                <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.3 }}
                  className="absolute inset-2 grid place-items-center rounded-[20px] border-4 border-dashed border-coral/60 font-display font-extrabold text-coral"
                  style={{ fontSize: `calc(${SIZE} * .6)`, lineHeight: 1 }}>?</motion.span>
              )}
              {/* Mặt sau của thẻ */}
              <span className="absolute inset-0 grid place-items-center rounded-[26px] bg-coral font-display font-extrabold text-white shadow-[inset_0_0_0_6px_rgba(255,255,255,.45)]"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', fontSize: `calc(${SIZE} * .55)`, lineHeight: 1 }}>?</span>
            </motion.div>
          );
        })}
      </div>
      <div className={`grid min-h-0 flex-1 grid-cols-3 gap-[2.5vw] transition-opacity duration-300 ${asking ? '' : 'pointer-events-none opacity-0'}`}>
        {choices.map((c) => (
          <ChoiceCard key={c.id} visual={c.visual} label={undefined} size="min(19vh, 12vw)" shakeKey={wrong[c.id] ?? 0}
            state={phase === 'found' ? (c === gone ? 'right' : 'dim') : wrong[c.id] ? 'wrong' : 'idle'}
            onPick={() => void pick(c)} />
        ))}
      </div>
    </GameScreen>
  );
}
