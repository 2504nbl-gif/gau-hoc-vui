import type { CSSProperties } from 'react';
import { TopBar } from '@/components/ui/TopBar';
import { TopicPicker } from '@/components/game/TopicPicker';
import { CardVisual } from '@/components/content/CardVisual';
import { discoveryLessons, findItem, pictureTopics } from '@/data/games';
import { getTopic } from '@/data';
import { useNav } from '@/store/useNav';
import { useProgressStore } from '@/store/useProgressStore';
import { sfx } from '@/services/audio/sfx';

/** Nhận biết: chọn chủ đề → chọn bài (mỗi bài 3 từ) → chơi kính lúp. */
export function DiscoveryHome({ topicId }: { topicId?: string }) {
  const go = useNav((s) => s.go);
  const results = useProgressStore((s) => s.gameResults);
  const topic = topicId ? getTopic(topicId) : undefined;
  const style = { '--c': 'var(--color-leaf)' } as CSSProperties;

  if (!topic) {
    const done = (id: string) => discoveryLessons(getTopic(id)!).filter((l) => results[`magnifier-${l.id}`]).length;
    return (
      <main className="room" style={style}>
        <TopBar title="Nhận biết" onBack={() => go({ name: 'dashboard' })} />
        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          <TopicPicker
            topics={pictureTopics(true)}
            onPick={(t) => go({ name: 'discovery', topicId: t.id })}
            badge={(t) => `${done(t.id)}/${discoveryLessons(t).length} bài`}
          />
        </div>
      </main>
    );
  }

  const lessons = discoveryLessons(topic);
  return (
    <main className="room" style={style}>
      <TopBar title={topic.title.vi} onBack={() => go({ name: 'discovery' })} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 p-0">
          {lessons.map((l, i) => {
            const stars = results[`magnifier-${l.id}`] ?? 0;
            return (
              <li key={l.id}>
                <button
                  onClick={() => { sfx.select(); go({ name: 'magnifier', topicId: topic.id, lesson: i }); }}
                  className="flex w-full flex-col gap-2 rounded-[24px] bg-paper p-4 text-left shadow-[0_5px_0_var(--color-line)]"
                >
                  <span className="flex items-center justify-between">
                    <b className="title-c font-display text-xl">Bài {i + 1}</b>
                    <span className="text-lg" aria-label={`${stars} sao`}>
                      {'⭐'.repeat(stars)}<span className="opacity-20">{'⭐'.repeat(3 - stars)}</span>
                    </span>
                  </span>
                  <span className="flex justify-around">
                    {l.targetIds.map((id) => <CardVisual key={id} visual={findItem(topic.id, id)!.visual} size="48px" />)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
