import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { TopBar } from '@/components/ui/TopBar';
import { RoundDots } from './RoundDots';
import { ResultModal, starsFor } from './ResultModal';
import { useProgressStore } from '@/store/useProgressStore';
import { preloadVoice, sayAll, stopVoice } from '@/services/audio/voice';
import { feedbackCorrect, feedbackDone, feedbackWrong } from '@/services/audio/feedback';
import { PHRASES } from '@/data/phrases';
import { Emoji } from '@/components/content/Emoji';

export interface Choice {
  id: string;
  node: ReactNode;
  ok: boolean;
  /** Tên đọc lên khi bé chạm (sai thì đọc để bé học thêm). */
  name?: string;
}

export interface ChoiceRound {
  /** Các mảnh câu cô đọc khi vào lượt, vd ["Bé đếm xem có bao nhiêu", "Con cá"]. */
  say: string[];
  /** Âm thanh phát thêm sau câu hỏi (vd trò đố âm thanh). */
  sound?: () => void;
  stage?: ReactNode;
  choices: Choice[];
  /** Câu đọc khi đúng, mặc định là `name` của đáp án đúng. */
  answerName?: string;
}

/**
 * Khung chung cho mọi trò "nghe câu hỏi → chạm đáp án": quản lý lượt, đọc câu hỏi,
 * khen/nhắc, chấm sao, màn hình kết quả. Mỗi trò chỉ cần viết hàm tạo lượt `make`.
 */
export function ChoiceGame({
  title, color, resultId, rounds, make, onExit, preload = [], cols,
}: {
  title: string;
  color: string;
  resultId: string;
  rounds: number;
  make: (i: number) => ChoiceRound;
  onExit: () => void;
  preload?: string[];
  cols?: number;
}) {
  const { childName, addStars, recordGame } = useProgressStore();
  const [game, setGame] = useState(0);
  const list = useMemo(() => Array.from({ length: rounds }, (_, i) => make(i)), [game]); // eslint-disable-line react-hooks/exhaustive-deps
  const [round, setRound] = useState(0);
  const [marks, setMarks] = useState<Record<string, 'right' | 'wrong'>>({});
  const [shake, setShake] = useState<{ id: string; k: number } | null>(null);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState<1 | 2 | 3>(3);
  const firstTry = useRef(0);
  const missed = useRef(false);
  const busy = useRef(false);
  const r = list[round];

  const ask = async () => {
    const ok = await sayAll(r.say).done;
    if (ok && r.sound) r.sound();
  };

  useEffect(() => {
    let off = false;
    setMarks({});
    missed.current = false;
    busy.current = false;
    const names = list.flatMap((x) => [...x.say, ...x.choices.map((c) => c.name ?? '')]).filter(Boolean);
    preloadVoice([PHRASES.correct, PHRASES.tryAgain, ...preload, ...names], 'vi').then(() => { if (!off) void ask(); });
    return () => { off = true; };
  }, [round, game]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopVoice(), []);

  const pick = async (c: Choice) => {
    if (busy.current || marks[c.id]) return;
    if (!c.ok) {
      missed.current = true;
      setMarks((m) => ({ ...m, [c.id]: 'wrong' }));
      setShake({ id: c.id, k: Date.now() });
      feedbackWrong(c.name);
      return;
    }
    busy.current = true;
    if (!missed.current) firstTry.current++;
    setMarks((m) => ({ ...m, [c.id]: 'right' }));
    await feedbackCorrect(r.answerName ?? c.name).done;
    await new Promise((res) => setTimeout(res, 350));
    if (round + 1 < list.length) { setRound(round + 1); return; }
    const s = starsFor(firstTry.current, list.length);
    setStars(s);
    setDone(true);
    recordGame(resultId, s, { correct: firstTry.current, total: list.length });
    addStars(s);
    feedbackDone(childName);
  };

  const again = () => { firstTry.current = 0; setDone(false); setRound(0); setGame((g) => g + 1); };

  return (
    <main className="room" style={{ '--c': `var(--color-${color})` } as CSSProperties}>
      <TopBar title={title} onBack={() => { stopVoice(); onExit(); }}
        right={<>
          <RoundDots total={list.length} current={round} />
          <button aria-label="Nghe lại" onClick={() => void ask()} className="press h-11 rounded-2xl px-4 font-extrabold">🔊</button>
        </>} />
      {r.stage && (
        <div className="flex min-h-0 flex-[1.2] items-center justify-center overflow-hidden rounded-[28px] bg-paper p-3 shadow-[0_5px_0_var(--color-line)]">
          {r.stage}
        </div>
      )}
      <div className="grid min-h-0 flex-1 gap-[2.5vw]" style={{ gridTemplateColumns: `repeat(${cols ?? r.choices.length}, minmax(0, 1fr))` }}>
        {r.choices.map((c) => {
          const m = marks[c.id];
          return (
            <motion.button
              key={`${round}-${c.id}-${shake?.id === c.id ? shake.k : 0}`}
              onClick={() => pick(c)}
              aria-label={c.name}
              animate={m === 'wrong' ? { x: [0, -12, 12, -8, 8, 0] } : m === 'right' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.45 }}
              whileTap={{ scale: 0.95 }}
              className={`flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-[26px] border-4 bg-paper p-2 shadow-[0_6px_0_var(--color-line)] ${
                m === 'right' ? 'border-leaf' : m === 'wrong' ? 'border-berry/50 opacity-60' : 'border-transparent'
              }`}
            >
              {c.node}
            </motion.button>
          );
        })}
      </div>
      <ResultModal open={done} stars={stars} message={`${childName} làm đúng ${list.length} lượt`} onAgain={again} onExit={onExit} />
    </main>
  );
}

/** Chữ số to dùng làm đáp án. */
export const BigNumber = ({ n }: { n: number | string }) => (
  <span className="font-display font-extrabold leading-none text-berry" style={{ fontSize: 'min(16vh, 11vw)' }}>{n}</span>
);

/** Rải `n` hình (emoji) thành cụm dễ đếm. */
export function Scatter({ emoji, n, size = 'min(9vh, 6vw)', hidden = 0 }: { emoji: string; n: number; size?: string; hidden?: number }) {
  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-[1.2vw]">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="relative leading-none" style={{ fontSize: size }}>
          <Emoji glyph={emoji} className="block" />
          {/* Vật "ẩn": bị lá che một nửa, bé phải nhìn kỹ */}
          {i < hidden && <span className="absolute inset-x-[-10%] bottom-[-10%] leading-none" style={{ fontSize: `calc(${size} * .9)` }}><Emoji glyph="🌿" className="block" /></span>}
        </span>
      ))}
    </div>
  );
}
