import { useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MODULES } from '@/data';
import type { ModuleDef } from '@/types/curriculum';
import { BearMascot } from '@/components/content/BearMascot';
import { StarChip } from '@/components/ui/TopBar';
import { useNav } from '@/store/useNav';
import { useProgressStore } from '@/store/useProgressStore';
import { say } from '@/services/audio/voice';
import { PHRASES } from '@/data/phrases';
import { sfx } from '@/services/audio/sfx';
import { Emoji } from '@/components/content/Emoji';
import { useRewardStore } from '@/store/useRewardStore';
import { STICKERS } from '@/data/stickers';
import { useDailyStore } from '@/store/useDailyStore';
import { StreakChip } from '@/features/daily/StreakChip';
import { dayKey } from '@/features/daily/plan';

const Cloud = ({ style }: { style: CSSProperties }) => (
  <span aria-hidden className="absolute h-8 rounded-full bg-white/90 before:absolute before:bottom-1/4 before:left-[15%] before:h-[150%] before:w-[55%] before:rounded-full before:bg-white/90" style={style} />
);

export function Dashboard() {
  const go = useNav((s) => s.go);
  const name = useProgressStore((s) => s.childName);
  const stickerCount = useRewardStore((s) => s.stickers.length);
  const dance = useRewardStore((s) => s.dance);
  const [toast, setToast] = useState<string | null>(null);

  const open = (m: ModuleDef) => {
    sfx.tap();
    if (m.status === 'ready') {
      say(m.title, 'vi');
      // Tráo thẻ và Nhận biết có màn hình riêng; các module khác mở danh sách trò chơi.
      if (m.id === 'flashcards') go({ name: 'flashcards' });
      else if (m.id === 'discovery') go({ name: 'discovery' });
      else go({ name: 'hub', module: m.id });
      return;
    }
    say(PHRASES.comingSoon(m.title, name), 'vi');
    setToast(`${m.title} sẽ có ở Giai đoạn ${m.phase}`);
    window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <main
      className="scene relative flex h-full flex-col overflow-hidden py-3"
      style={{ paddingLeft: 'max(20px, env(safe-area-inset-left, 0px))', paddingRight: 'max(20px, env(safe-area-inset-right, 0px))' }}
    >
      <Cloud style={{ width: 140, top: '14%', left: '6%' }} />
      <Cloud style={{ width: 110, top: '9%', right: '22%' }} />
      <Cloud style={{ width: 90, top: '30%', right: '5%' }} />

      <div className="relative z-10 flex items-center gap-3">
        <StarChip />
        <button
          aria-label={`${PHRASES.stickerBook}: ${stickerCount}/${STICKERS.length}`}
          onClick={() => { sfx.tap(); say(PHRASES.stickerBook, 'vi'); go({ name: 'sticker-book' }); }}
          className="press inline-flex h-11 items-center gap-1.5 rounded-full px-4 font-extrabold tabular-nums"
          style={{ '--c': 'var(--color-grape)' } as CSSProperties}
        >
          📒 {stickerCount}
        </button>
        <StreakChip />
      </div>

      <section className="relative z-10 flex min-h-0 flex-1 flex-wrap items-center justify-center gap-6">
        <button
          aria-label="Xem Gấu nhảy múa"
          onClick={() => { sfx.select(); dance(); }}
          className="w-[clamp(110px,17vw,180px)] [animation:bob_3s_ease-in-out_infinite]"
        >
          <BearMascot className="block w-full" />
        </button>
        <div>
          <h1 className="m-0 font-display text-[clamp(44px,7vw,84px)] font-extrabold leading-[.9] text-leaf [text-shadow:0_4px_0_#fff,0_7px_0_#2e7d40]">
            Gấu
            <span className="block text-sun [text-shadow:0_4px_0_#fff,0_7px_0_#a8731a]">Học Vui</span>
          </h1>
          <button
            onClick={() => { sfx.select(); say(PHRASES.greet(name), 'vi'); }}
            className="mt-3 mb-0 block max-w-[30ch] [@media(max-height:420px)]:hidden rounded-2xl rounded-bl-sm bg-paper px-4 py-2 text-left text-lg font-extrabold"
          >
            {PHRASES.greet(name)}
          </button>
          <DailyButton onOpen={() => { sfx.select(); useDailyStore.getState().ensureToday(); go({ name: 'daily' }); }} />
        </div>
      </section>

      <nav aria-label="Môn học" className="relative z-10 flex snap-x gap-1.5 overflow-x-auto px-0.5 pt-1.5 pb-2.5">
        {MODULES.map((m, i) => (
          <motion.button
            key={m.id}
            onClick={() => open(m)}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.93 }}
            className="hex aspect-[1/0.92] w-[clamp(124px,14vw,164px)] flex-none snap-start bg-white p-1.5"
            style={{ '--c': `var(--color-${m.color})` } as CSSProperties}
          >
            <div className="hex tint relative flex h-full flex-col items-center justify-center gap-0.5">
              <span className={`text-[clamp(38px,4.6vw,54px)] leading-tight ${m.status === 'planned' ? 'opacity-55 grayscale-[.4]' : ''}`}><Emoji glyph={m.icon} /></span>
              <b className="title-c font-display text-lg">{m.title}</b>
              {m.status === 'planned' && <span className="text-xs font-extrabold text-soft">Sắp có</span>}
            </div>
          </motion.button>
        ))}
      </nav>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 font-extrabold text-white"
            style={{ bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/** Nút to "Bài học hôm nay": nhún nhảy khi chưa học xong, có số trạm đã xong. */
function DailyButton({ onOpen }: { onOpen: () => void }) {
  const plan = useDailyStore((s) => s.plan);
  const today = plan?.day === dayKey() ? plan : null;
  const done = today ? today.done.filter(Boolean).length : 0;
  const finished = !!today && done === today.steps.length;
  return (
    <motion.button
      onClick={onOpen}
      animate={finished ? {} : { scale: [1, 1.05, 1] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      whileTap={{ scale: 0.95 }}
      className="press mt-[2vh] inline-flex h-[clamp(52px,10vh,84px)] items-center gap-3 rounded-3xl px-6 font-display text-[clamp(20px,min(3vw,5vh),30px)] font-extrabold"
      style={{ '--c': `var(--color-${finished ? 'leaf' : 'peach'})` } as CSSProperties}
    >
      <span className="text-[1.3em] leading-none">{finished ? '🏆' : '🗺️'}</span>
      {PHRASES.dailyLesson}
      {today && done > 0 && (
        <span className="rounded-full bg-white/30 px-3 py-0.5 text-[.7em] tabular-nums">{finished ? '✓' : `${done}/${today.steps.length}`}</span>
      )}
    </motion.button>
  );
}
