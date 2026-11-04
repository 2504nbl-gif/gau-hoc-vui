import type { CSSProperties } from 'react';
import { TopBar } from '@/components/ui/TopBar';
import { MODULES } from '@/data';
import { GAMES, gameRoute } from '@/features/registry';
import { useNav } from '@/store/useNav';
import { useProgressStore } from '@/store/useProgressStore';
import { say } from '@/services/audio/voice';
import { sfx } from '@/services/audio/sfx';
import type { ModuleId } from '@/types/curriculum';
import { Emoji } from '@/components/content/Emoji';

/** Màn hình một module: danh sách trò chơi của module đó (đọc từ registry). */
export function GameHub({ module }: { module: ModuleId }) {
  const go = useNav((s) => s.go);
  const results = useProgressStore((s) => s.gameResults);
  const def = MODULES.find((m) => m.id === module)!;
  const games = GAMES.filter((g) => g.module === module);

  return (
    <main className="room" style={{ '--c': `var(--color-${def.color})` } as CSSProperties}>
      <TopBar title={def.title} onBack={() => go({ name: 'dashboard' })} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4 p-0">
          {games.map((g) => {
            const st = results[g.arg ? `memory-${g.arg}` : g.id] ?? 0;
            return (
              <li key={g.id}>
                <button
                  onClick={() => { sfx.select(); say(g.title); go(gameRoute(g)); }}
                  className="press relative flex h-40 w-full flex-col justify-between overflow-hidden rounded-[26px] p-4 text-left"
                  style={{ '--c': `var(--color-${g.color})` } as CSSProperties}
                >
                  <b className="relative z-10 max-w-[68%] font-display text-2xl leading-tight [text-wrap:balance]">{g.title}</b>
                  <span className="relative z-10 max-w-[62%] text-sm font-bold opacity-90">{g.note}</span>
                  {st > 0 && <span className="absolute top-3 right-3 z-10 text-sm" aria-label={`${st} sao`}>{'⭐'.repeat(st)}</span>}
                  <span className="absolute -right-3 -bottom-3 grid size-28 place-items-center rounded-full bg-white/90 text-6xl" aria-hidden><Emoji glyph={g.icon} /></span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
