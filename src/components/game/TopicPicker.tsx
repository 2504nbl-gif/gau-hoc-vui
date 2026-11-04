import type { ReactNode } from 'react';
import type { Topic } from '@/types/content';
import { CardVisual } from '@/components/content/CardVisual';
import { say } from '@/services/audio/voice';
import { sfx } from '@/services/audio/sfx';

/** Lưới chọn chủ đề có hình minh họa — dùng chung cho Nhận biết, Nghe & Tìm. */
export function TopicPicker({ topics, onPick, badge }: { topics: Topic[]; onPick: (t: Topic) => void; badge?: (t: Topic) => ReactNode }) {
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4 p-0">
      {topics.map((t) => (
        <li key={t.id}>
          <button
            onClick={() => { sfx.select(); say(t.title.vi); onPick(t); }}
            className="tint relative flex h-36 w-full flex-col items-start overflow-hidden rounded-[24px] p-3.5 text-left shadow-[0_5px_0_color-mix(in_srgb,var(--c)_40%,white)]"
          >
            <b className="title-c relative z-10 max-w-[65%] font-display text-xl leading-tight [text-wrap:balance]">{t.title.vi}</b>
            {badge && <span className="relative z-10 mt-auto text-sm font-extrabold text-soft">{badge(t)}</span>}
            <span className="absolute -right-2 -bottom-2 grid size-24 place-items-center rounded-full bg-paper">
              <CardVisual visual={t.items[0].visual} size="52px" />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
