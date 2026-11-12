import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Emoji } from '@/components/content/Emoji';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { useDragDrop } from '@/components/game/useDragDrop';
import { SHARE_FRIENDS, SHARE_ITEMS, SHARE_ROUNDS } from '@/data/early';
import { NUMBER_WORDS, PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { preloadVoice, say, sayAll } from '@/services/audio/voice';
import { feedbackCorrect } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

const ROUNDS = SHARE_ROUNDS.length;
const FRIEND = 'min(21vh, 11vw)';
const ITEM = 'min(13vh, 7vw)';

/** Chia kẹo cho bạn (tương ứng 1–1): kéo cho mỗi bạn đúng 1 cái, vòng sau mỗi bạn 2 cái; đặt cái nào đếm cái đó. */
export function ShareTreats({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'share-treats', rounds: ROUNDS });
  const cfg = SHARE_ROUNDS[s.round];
  const items = useMemo(() => shuffle(SHARE_ITEMS), [s.game]);
  const item = items[s.round % items.length];
  const friends = useMemo(() => shuffle(SHARE_FRIENDS).slice(0, cfg.friends), [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = cfg.friends * cfg.each;
  const pieces = useMemo(() => Array.from({ length: total }, (_, i) => i), [total]);
  /** Số cái mỗi bạn đã có (khóa = emoji của bạn). */
  const [got, setGot] = useState<Record<string, number>>({});
  const [used, setUsed] = useState<number[]>([]);
  const [bounce, setBounce] = useState<{ id: string; k: number } | null>(null);

  /** "Bé chia cho mỗi bạn · Một · Kẹo mút". */
  const ask = () => sayAll([PHRASES.shareHint, NUMBER_WORDS[cfg.each], item.name]);

  useEffect(() => {
    setGot({});
    setUsed([]);
    setBounce(null);
    preloadVoice([PHRASES.shareHint, PHRASES.shareFull, PHRASES.shareDone, PHRASES.correct, ...NUMBER_WORDS,
      ...SHARE_ITEMS.map((x) => x.name), ...SHARE_FRIENDS.map((x) => x.name)], 'vi').then(() => ask());
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasRoom = (zone: string) => (got[zone] ?? 0) < cfg.each;

  const dnd = useDragDrop<number>(async (piece, zone) => {
    if (!zone) return;
    if (!hasRoom(zone)) { // bạn này đủ phần rồi → phải chia cho bạn khác
      s.miss();
      setBounce({ id: zone, k: Date.now() });
      sfx.wrong();
      say(PHRASES.shareFull);
      return;
    }
    const n = used.length + 1;
    setGot((g) => ({ ...g, [zone]: (g[zone] ?? 0) + 1 }));
    setUsed((u) => [...u, piece]);
    sfx.pop();
    const counted = say(NUMBER_WORDS[n]).done; // đếm thành tiếng: "Một, hai, ba…"
    if (n < total) return;
    await counted;
    await feedbackCorrect(PHRASES.shareDone).done;
    setTimeout(s.win, 300);
  }, { accept: (_, zone) => hasRoom(zone), onTap: () => say(item.name) });

  return (
    <GameScreen title="Chia kẹo cho bạn" color="peach" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => ask()}>
      <div className="flex min-h-0 flex-1 flex-col justify-around gap-2">
        <div className="flex items-end justify-center gap-[2.5vw]">
          {friends.map((f) => {
            const have = got[f.emoji] ?? 0;
            const full = have >= cfg.each;
            return (
              <motion.button key={`${f.emoji}-${bounce?.id === f.emoji ? bounce.k : 0}`} data-drop={f.emoji} data-full={full ? '' : undefined}
                aria-label={f.name} onClick={() => say(f.name)}
                animate={bounce?.id === f.emoji ? { x: [0, -10, 10, -6, 6, 0] } : {}}
                className={`flex flex-col items-center gap-1 rounded-[28px] border-4 p-[1vw] transition-colors ${
                  dnd.over === f.emoji ? 'border-peach bg-peach/20' : full ? 'border-leaf/60 bg-leaf/10' : 'border-dashed border-peach/40 bg-white/60'}`}>
                {/* Bạn nhận đủ phần thì nhún nhảy vui mừng */}
                <motion.span key={have} className="leading-none" initial={false}
                  animate={have ? { y: [0, -14, 0, -6, 0], rotate: [0, -6, 6, 0] } : {}} transition={{ duration: 0.6 }}>
                  <Emoji glyph={f.emoji} size={FRIEND} />
                </motion.span>
                {/* Chỗ ngồi ở bàn: mỗi ô tròn là một phần còn thiếu */}
                <span className="flex gap-[0.6vw] rounded-2xl bg-[#e9c9a0] px-[1vw] py-1 shadow-[0_4px_0_#cfa877]">
                  {Array.from({ length: cfg.each }, (_, k) => (
                    <span key={k} className="grid place-items-center rounded-full border-2 border-dashed border-white/90 bg-white/50" style={{ width: ITEM, height: ITEM }}>
                      {k < have && (
                        <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.55 }} className="leading-none">
                          <Emoji glyph={item.emoji} size={`calc(${ITEM} * .82)`} />
                        </motion.span>
                      )}
                    </span>
                  ))}
                </span>
              </motion.button>
            );
          })}
        </div>
        <div className="mx-auto flex items-center justify-center gap-[1.6vw] rounded-[26px] bg-paper px-[2vw] py-2 shadow-[0_6px_0_var(--color-line)]">
          {pieces.map((id) => {
            const gone = used.includes(id);
            return (
              <motion.div key={`${s.game}-${s.round}-${id}`} aria-label={item.name} data-piece={gone ? undefined : id}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: id * 0.06 }}
                onPointerDown={(e) => !gone && dnd.start(e, id, <Emoji glyph={item.emoji} size={ITEM} />)}
                className={`grid touch-none place-items-center leading-none ${gone ? 'invisible' : 'cursor-grab'}`}
                style={{ opacity: dnd.dragging === id ? 0.3 : undefined }}>
                <Emoji glyph={item.emoji} size={ITEM} />
              </motion.div>
            );
          })}
        </div>
      </div>
      {dnd.ghost}
    </GameScreen>
  );
}
