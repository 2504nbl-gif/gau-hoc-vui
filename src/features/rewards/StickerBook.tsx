import { useEffect, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TopBar } from '@/components/ui/TopBar';
import { STICKER_PAGES, STICKERS, type Sticker } from '@/data/stickers';
import { PHRASES } from '@/data/phrases';
import { useNav } from '@/store/useNav';
import { useRewardStore } from '@/store/useRewardStore';
import { say, stopVoice } from '@/services/audio/voice';
import { sfx } from '@/services/audio/sfx';

/** Viền trắng quanh emoji cho giống sticker dán. */
const STICKER_EDGE = 'drop-shadow(0 0 0 #fff) drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 5px 4px rgba(0,0,0,.2))';

/** Sổ sticker: 4 trang lật, ô chưa có là bóng mờ, chạm sticker đã có thì nghe tên. */
export function StickerBook() {
  const go = useNav((s) => s.go);
  const owned = useRewardStore((s) => s.stickers);
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const [wiggle, setWiggle] = useState<string | null>(null);
  const p = STICKER_PAGES[page];

  useEffect(() => { say(PHRASES.stickerBookHello, 'vi'); return () => stopVoice(); }, []);

  const turn = (to: number) => {
    if (to === page || to < 0 || to >= STICKER_PAGES.length) return;
    sfx.flip();
    setDir(to > page ? 1 : -1);
    setPage(to);
    say(STICKER_PAGES[to].title, 'vi');
  };

  const tap = (s: Sticker) => {
    if (owned.includes(s.id)) { sfx.pop(); say(s.name, 'vi'); setWiggle(s.id); window.setTimeout(() => setWiggle(null), 600); }
    else { sfx.tap(); say(PHRASES.stickerLocked, 'vi'); }
  };

  return (
    <main className="room" style={{ '--c': 'var(--color-grape)' } as CSSProperties}>
      <TopBar title={PHRASES.stickerBook} onBack={() => go({ name: 'dashboard' })}
        right={<span className="inline-flex h-11 items-center rounded-full bg-paper px-4 font-extrabold tabular-nums shadow-[0_3px_0_var(--color-line)]">
          📒 {owned.length}/{STICKERS.length}</span>} />

      <div className="flex min-h-0 flex-1 items-center gap-3">
        <PageArrow label="Trang trước" disabled={page === 0} onClick={() => turn(page - 1)}>‹</PageArrow>

        {/* Cuốn sổ: gáy bên trái, trang lật quanh gáy */}
        <div className="relative h-full min-w-0 flex-1 [perspective:1600px]">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.section
              key={page}
              custom={dir}
              variants={{
                enter: (d: number) => ({ rotateY: d > 0 ? 75 : -75, opacity: 0 }),
                center: { rotateY: 0, opacity: 1 },
                exit: (d: number) => ({ rotateY: d > 0 ? -75 : 75, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              onPanEnd={(_, i) => { if (i.offset.x < -60) turn(page + 1); else if (i.offset.x > 60) turn(page - 1); }}
              transition={{ duration: 0.32, ease: 'easeInOut' }}
              style={{ transformOrigin: 'left center', '--c': `var(--color-${p.color})` } as CSSProperties}
              className="absolute inset-0 flex flex-col rounded-[28px] rounded-l-lg border-l-[14px] border-[color-mix(in_srgb,var(--c)_70%,black)] bg-paper p-[clamp(10px,2vh,20px)] shadow-[0_6px_0_var(--color-line)]"
            >
              <h2 className="title-c m-0 flex items-center gap-2 font-display text-[clamp(22px,3.6vw,34px)] font-extrabold">
                <span>{p.icon}</span>{p.title}
                <span className="ml-auto text-base font-bold text-soft">
                  {p.stickers.filter((s) => owned.includes(s.id)).length}/{p.stickers.length}
                </span>
              </h2>
              <ul className="m-0 grid min-h-0 flex-1 list-none grid-cols-5 grid-rows-2 gap-[clamp(6px,1.5vw,16px)] p-0 pt-2">
                {p.stickers.map((s) => {
                  const has = owned.includes(s.id);
                  return (
                    <li key={s.id} className="min-h-0">
                      <motion.button
                        aria-label={has ? s.name : 'Ô trống'}
                        onClick={() => tap(s)}
                        whileTap={{ scale: 0.9 }}
                        animate={wiggle === s.id ? { rotate: [0, -12, 12, -6, 0], scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.5 }}
                        className={`tint grid size-full place-items-center rounded-3xl text-[min(11vh,7vw)] leading-none ${has ? '' : 'border-[3px] border-dashed border-[color-mix(in_srgb,var(--c)_35%,white)]'}`}
                      >
                        <span style={{ filter: has ? STICKER_EDGE : 'brightness(0) opacity(.13)' }}>{s.emoji}</span>
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
            </motion.section>
          </AnimatePresence>
        </div>

        <PageArrow label="Trang sau" disabled={page === STICKER_PAGES.length - 1} onClick={() => turn(page + 1)}>›</PageArrow>
      </div>

      {/* Mục lục: chạm biểu tượng để mở thẳng trang đó */}
      <nav aria-label="Các trang" className="flex justify-center gap-3">
        {STICKER_PAGES.map((x, i) => (
          <button key={x.title} aria-label={x.title} onClick={() => turn(i)}
            className={`${i === page ? 'press' : 'press-ghost'} h-12 w-16 rounded-2xl text-2xl`}
            style={{ '--c': `var(--color-${x.color})` } as CSSProperties}>
            {x.icon}
          </button>
        ))}
      </nav>
    </main>
  );
}

function PageArrow({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: string }) {
  return (
    <button aria-label={label} disabled={disabled} onClick={onClick}
      className="press grid h-24 w-14 flex-none place-items-center rounded-2xl text-5xl font-extrabold leading-none disabled:opacity-30">
      {children}
    </button>
  );
}
