import { useEffect, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { TopBar } from '@/components/ui/TopBar';
import { PressButton } from '@/components/ui/PressButton';
import { TraceCanvas } from '@/components/game/TraceCanvas';
import { DIGITS, looksLikeSentence } from '@/data/art';
import { NUMBER_WORDS, PHRASES } from '@/data/phrases';
import { useProgressStore } from '@/store/useProgressStore';
import { preloadVoice, say, stopVoice } from '@/services/audio/voice';
import { feedbackCorrect } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';
import { FlowerPot } from '@/features/cognitive/choiceGames';


/**
 * Làm quen số 0–9 theo 3 bước:
 * 1) Lý thuyết: số lượng + liên tưởng hình ảnh   2) Tập viết số   3) Thực hành chọn chậu hoa.
 */
export function NumberLesson({ onExit }: GameProps) {
  const results = useProgressStore((s) => s.gameResults);
  const [digit, setDigit] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const style = { '--c': 'var(--color-sun)' } as CSSProperties;

  if (digit === null) {
    return (
      <main className="room" style={style}>
        <TopBar title="Làm quen chữ số" onBack={onExit} />
        <div className="grid min-h-0 flex-1 grid-cols-5 gap-3">
          {DIGITS.map((d) => {
            const st = results[`flower-pot${d.n}`] ?? 0;
            return (
              <button key={d.n} onClick={() => { sfx.select(); say(`Số ${NUMBER_WORDS[d.n].toLowerCase()}`); setDigit(d.n); setStep(1); }}
                className="press flex min-h-0 flex-col items-center justify-center rounded-[26px]" style={{ '--c': 'var(--color-sun)' } as CSSProperties}>
                <span className="font-display font-extrabold leading-none" style={{ fontSize: 'min(16vh, 9vw)' }}>{d.n}</span>
                <span className="text-sm" aria-label={`${st} sao`}>{'⭐'.repeat(st)}<span className="opacity-30">{'⭐'.repeat(3 - st)}</span></span>
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  if (step === 3) return <FlowerPot arg={String(digit)} onExit={() => setDigit(null)} />;

  return (
    <main className="room" style={style}>
      <TopBar title={`Số ${digit} · Bước ${step}/3`} onBack={() => { stopVoice(); setDigit(null); }} />
      {step === 1 ? <Theory n={digit} onNext={() => setStep(2)} /> : <Write n={digit} onNext={() => setStep(3)} />}
    </main>
  );
}

/** Bước 1: chữ số to + đếm từng vật + "Số 1 giống cây bút chì". */
function Theory({ n, onNext }: { n: number; onNext: () => void }) {
  const d = DIGITS[n];
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let off = false;
    (async () => {
      await preloadVoice([PHRASES.countTogether, looksLikeSentence(n), `Số ${NUMBER_WORDS[n].toLowerCase()}`, ...NUMBER_WORDS], 'vi');
      await say(`Số ${NUMBER_WORDS[n].toLowerCase()}`).done;
      if (n > 0) {
        await say(PHRASES.countTogether).done;
        for (let i = 1; i <= n && !off; i++) { setShown(i); sfx.pop(); await say(NUMBER_WORDS[i]).done; await new Promise((r) => setTimeout(r, 250)); }
      }
      if (!off) await say(looksLikeSentence(n)).done;
    })();
    return () => { off = true; stopVoice(); };
  }, [n]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex min-h-0 flex-1 items-center justify-center gap-[4vw]">
        <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="font-display font-extrabold leading-none text-berry" style={{ fontSize: 'min(42vh, 26vw)' }}>{n}</motion.span>
        <div className="flex flex-col items-center gap-3">
          <div className="flex max-w-[44vw] flex-wrap justify-center gap-2 rounded-[26px] bg-paper p-4 shadow-[0_5px_0_var(--color-line)]" style={{ minHeight: 'min(14vh, 90px)' }}>
            {n === 0 ? <span className="self-center font-bold text-soft">Không có gì cả 🫙</span>
              : Array.from({ length: shown }, (_, i) => (
                <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: 'min(8vh, 5vw)' }}>{d.objEmoji}</motion.span>
              ))}
          </div>
          <div className="flex items-center gap-3 rounded-[26px] bg-paper px-5 py-3 shadow-[0_5px_0_var(--color-line)]">
            <span style={{ fontSize: 'min(10vh, 7vw)' }}>{d.looksEmoji}</span>
            <span className="max-w-[18ch] font-display text-xl font-extrabold">{looksLikeSentence(n)}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-center"><PressButton size="lg" color="sun" onClick={onNext}>Tập viết ▶</PressButton></div>
    </div>
  );
}

/** Bước 2: tô chữ số theo nét chấm có mũi tên. */
function Write({ n, onNext }: { n: number; onNext: () => void }) {
  const [done, setDone] = useState(false);
  useEffect(() => { preloadVoice([PHRASES.writeHint, PHRASES.practice], 'vi').then(() => say(PHRASES.writeHint)); }, [n]);
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
      <TraceCanvas strokes={DIGITS[n].strokes} color="#e0547b" size="min(64vh, 50vw)"
        onDone={async () => { setDone(true); await feedbackCorrect(`Số ${NUMBER_WORDS[n].toLowerCase()}`).done; say(PHRASES.practice); }} />
      {done && <PressButton size="lg" color="leaf" onClick={onNext}>Luyện tập ▶</PressButton>}
    </div>
  );
}
