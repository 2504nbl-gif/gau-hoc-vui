import { useState, type CSSProperties } from 'react';
import { STORIES, STORY_KINDS } from '@/data/stories';
import { TopBar } from '@/components/ui/TopBar';
import { Segmented } from '@/components/ui/Segmented';
import { CardVisual } from '@/components/content/CardVisual';
import { useNav } from '@/store/useNav';
import { say } from '@/services/audio/voice';
import { sfx } from '@/services/audio/sfx';
import type { Story } from '@/types/content';

export function StoryLibrary() {
  const go = useNav((s) => s.go);
  const [kind, setKind] = useState<Story['kind']>('poem');
  const list = STORIES.filter((s) => s.kind === kind);

  return (
    <main className="room" style={{ '--c': 'var(--color-sea)' } as CSSProperties}>
      <TopBar title="Truyện thơ tiềm thức" onBack={() => go({ name: 'hub', module: 'language-games' })} />
      <div className="flex justify-center">
        <Segmented<Story['kind']>
          label="Loại bài"
          value={kind}
          onChange={(k) => { setKind(k); say(STORY_KINDS.find((x) => x.kind === k)!.title, 'vi'); }}
          options={STORY_KINDS.map((k) => ({ value: k.kind, label: k.title }))}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 p-0">
          {list.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => { sfx.select(); go({ name: 'story-player', storyId: s.id }); }}
                className="press relative flex h-40 w-full flex-col justify-between overflow-hidden rounded-[26px] p-4 text-left"
                style={{ '--c': 'var(--color-grape)' } as CSSProperties}
              >
                <b className="relative z-10 max-w-[70%] font-display text-2xl leading-tight [text-wrap:balance]">{s.title}</b>
                <span className="relative z-10 text-sm font-bold opacity-85">{s.lines.length} {s.kind === 'story' ? 'câu' : 'dòng'}</span>
                <span className="absolute -right-3 -bottom-3 grid size-28 place-items-center rounded-full bg-white/90">
                  <CardVisual visual={s.cover} size="64px" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
