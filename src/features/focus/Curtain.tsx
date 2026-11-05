import { useEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { Emoji, emojiKey } from '@/components/content/Emoji';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { getTopic, spokenText } from '@/data';
import { EMOJI_IMAGES } from '@/data/emojiIndex';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say, sayAll } from '@/services/audio/voice';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

const ROUNDS = 5;
/** Chủ đề có hình to, quen thuộc với bé 2 tuổi. */
const TOPIC_IDS = ['pets', 'wild', 'fruits', 'vehicles', 'toys', 'sea', 'birds'];
/** Kéo được quá ngưỡng này thì rèm tự mở hết. */
const OPEN_AT = 0.4;

interface Pic { emoji: string; name: string }

function pickPictures(): Pic[] {
  const all = TOPIC_IDS.flatMap((id) => getTopic(id)?.items ?? [])
    .filter((it) => it.visual.kind === 'emoji' && EMOJI_IMAGES.has(emojiKey(it.visual.value)))
    .map((it) => ({ emoji: (it.visual as { value: string }).value, name: spokenText(it, 'vi') }));
  return shuffle(all).slice(0, ROUNDS);
}

/** Vải rèm có nếp gấp: dải sáng tối lặp lại theo chiều rủ xuống. */
const fabric = (deg: number) => ({
  background: `repeating-linear-gradient(${deg}deg, #c2364f 0 6%, #e0547b 11%, #f07a98 15%, #e0547b 19%, #c2364f 25%)`,
  boxShadow: 'inset 0 0 30px rgba(0,0,0,.25)',
});

/** Kéo rèm: rèm che một bức tranh, bé kéo rèm ra (ngang hoặc lên, xen kẽ) → cô đọc tên hình. */
export function Curtain({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'curtain', rounds: ROUNDS });
  const pics = useMemo(pickPictures, [s.game]);
  const pic = pics[s.round];
  const side = s.round % 2 === 0; // lượt chẵn: kéo sang hai bên; lượt lẻ: kéo lên
  const p = useMotionValue(0);
  const [open, setOpen] = useState(false);
  const [wiggle, setWiggle] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const hint = side ? PHRASES.curtainSide : PHRASES.curtainUp;

  const leftX = useTransform(p, (v) => `${-v * 100}%`);
  const rightX = useTransform(p, (v) => `${v * 100}%`);
  const upY = useTransform(p, (v) => `${-v * 100}%`);

  useEffect(() => {
    p.set(0); setOpen(false);
    preloadVoice([PHRASES.curtainSide, PHRASES.curtainUp, PHRASES.thisIs, ...pics.map((x) => x.name)], 'vi').then(() => say(hint));
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps

  const reveal = async () => {
    setOpen(true);
    sfx.flip();
    await animate(p, 1, { duration: 0.5, ease: 'easeOut' });
    sfx.correct();
    await sayAll([PHRASES.thisIs, pic.name]).done;
    setTimeout(s.win, 900);
  };

  const onDown = (e: React.PointerEvent) => {
    if (open || !box.current) return;
    e.preventDefault();
    const r = box.current.getBoundingClientRect();
    const from = { x: e.clientX, y: e.clientY };
    const id = e.pointerId;
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      const v = side ? Math.abs(ev.clientX - from.x) / (r.width / 2) : Math.max(0, from.y - ev.clientY) / r.height;
      if (v > 0.03) moved = true;
      p.set(Math.min(1, v));
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (p.get() >= OPEN_AT) { reveal(); return; }
      animate(p, 0, { type: 'spring', bounce: 0.4, duration: 0.5 });
      if (!moved) { setWiggle((w) => w + 1); say(hint); }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  return (
    <GameScreen title="Kéo rèm" color="coral" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(open ? pic.name : hint)}>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="relative w-[min(62vw,92vh)]">
          {/* Thanh treo rèm */}
          <div className="absolute -left-[3%] -right-[3%] -top-[5%] z-20 h-[5%] min-h-3 rounded-full bg-[#8a5a35] shadow-[0_4px_0_#5f3b20]" />
          <div ref={box} data-curtain={side ? 'side' : 'up'} onPointerDown={onDown}
            className="relative aspect-[4/3] touch-none overflow-hidden rounded-[28px] border-[10px] border-[#c99a6b] bg-white shadow-[0_8px_0_#a77a4f]">
            <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle,#fff8e6,#ffe7b8)]">
              <motion.div key={pic.emoji} animate={open ? { scale: [0.7, 1.1, 1] } : { scale: 0.7 }} transition={{ duration: 0.6 }}>
                <Emoji glyph={pic.emoji} size="min(40vh, 28vw)" />
              </motion.div>
            </div>
            <motion.div key={`${s.round}-${wiggle}`} className="absolute inset-0"
              animate={wiggle ? (side ? { x: [0, -8, 8, -4, 0] } : { y: [0, -10, 0, -5, 0] }) : {}} transition={{ duration: 0.5 }}>
              {side ? (
                <>
                  <motion.div className="absolute inset-y-0 left-0 w-1/2 rounded-r-[18px]" style={{ ...fabric(90), x: leftX }} />
                  <motion.div className="absolute inset-y-0 right-0 w-1/2 rounded-l-[18px]" style={{ ...fabric(90), x: rightX }} />
                </>
              ) : (
                <motion.div className="absolute inset-0 rounded-b-[18px]" style={{ ...fabric(180), y: upY }}>
                  <div className="absolute inset-x-[44%] bottom-[4%] h-[9%] rounded-full bg-[#f2b23a] shadow-[0_3px_0_#b9801d]" />
                </motion.div>
              )}
            </motion.div>
          </div>
          {!open && (
            <motion.div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 text-[min(10vh,7vw)]"
              animate={side ? { x: [-30, 30, -30] } : { y: [20, -30, 20] }} transition={{ duration: 1.6, repeat: Infinity }}>
              <Emoji glyph="👆" />
            </motion.div>
          )}
        </div>
      </div>
    </GameScreen>
  );
}
