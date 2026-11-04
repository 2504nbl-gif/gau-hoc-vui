import { useState, type CSSProperties } from 'react';
import { TOPICS, topicSupports } from '@/data';
import { TopBar } from '@/components/ui/TopBar';
import { PressButton } from '@/components/ui/PressButton';
import { useNav } from '@/store/useNav';
import { useFlashcardStore } from '@/store/useFlashcardStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useFamilyStore } from '@/store/useFamilyStore';
import { FLASHCARD_LIMITS } from '@/types/settings';
import { say } from '@/services/audio/voice';
import { PHRASES } from '@/data/phrases';
import { sfx } from '@/services/audio/sfx';
import { FlashcardSettingsModal } from './FlashcardSettingsModal';

export function FlashcardHome() {
  const go = useNav((s) => s.go);
  const { settings, selected, toggleTopic } = useFlashcardStore();
  const views = useProgressStore((s) => s.flashcardViews);
  const [showSettings, setShowSettings] = useState(false);
  const lang = settings.lang;
  const family = useFamilyStore((s) => s.topic);
  const topics = [...(family ? [family] : []), ...TOPICS].filter((t) => topicSupports(t, lang));
  const { minTopics, maxTopics } = FLASHCARD_LIMITS;
  const ready = selected.length >= minTopics;

  const onToggle = (id: string, title: string) => {
    const r = toggleTopic(id);
    if (r === 'full') { sfx.wrong(); say(lang === 'vi' ? PHRASES.maxTopics(maxTopics) : `${maxTopics} topics at most`, lang); return; }
    sfx.select();
    if (r === 'added') say(title, lang);
  };

  return (
    <main className="room" style={{ '--c': 'var(--color-coral)' } as CSSProperties}>
      <TopBar
        title="Tráo thẻ"
        onBack={() => go({ name: 'dashboard' })}
        right={<PressButton variant="ghost" onClick={() => setShowSettings(true)}>⚙️ Cài đặt</PressButton>}
      />
      <p className="m-0 text-center font-bold text-soft">
        Chọn {minTopics}–{maxTopics} chủ đề rồi bấm Tráo · bấm ▶ trên một chủ đề để tráo riêng chủ đề đó
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto pt-4 pb-2">
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-x-4 gap-y-6 p-0">
          {topics.map((t) => {
            const on = selected.includes(t.id);
            const order = selected.indexOf(t.id) + 1;
            return (
              <li key={t.id} className="isolate">
                <div
                  role="checkbox"
                  aria-checked={on}
                  tabIndex={0}
                  onClick={() => onToggle(t.id, t.title[lang])}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(t.id, t.title[lang]); } }}
                  className={`folder grid aspect-[1.35] cursor-pointer place-items-center px-3 pt-7 pb-3 text-center outline-offset-4 ${on ? 'outline-4 outline-coral' : ''}`}
                >
                  <span className="font-display text-xl leading-tight font-extrabold text-[#b4561a]">{t.title[lang]}</span>
                  <span className="absolute bottom-2.5 left-3 text-sm font-extrabold text-[#9a4a16]/80 tabular-nums">
                    {t.items.length} thẻ{views[t.id] ? ` · đã xem ${views[t.id]}` : ''}
                  </span>
                  {on && (
                    <span className="absolute -top-3 -left-2 grid size-9 place-items-center rounded-full bg-coral font-display text-lg font-extrabold text-white shadow">
                      {order}
                    </span>
                  )}
                  <button
                    aria-label={`Tráo riêng ${t.title[lang]}`}
                    onClick={(e) => { e.stopPropagation(); sfx.tap(); go({ name: 'flashcard-player', topicIds: [t.id] }); }}
                    className="absolute top-6 right-2.5 grid size-10 place-items-center rounded-full bg-[#e8822f] text-white"
                  >
                    ▶
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-4">
        <span className="font-extrabold text-soft tabular-nums">Đã chọn {selected.length}/{maxTopics}</span>
        <PressButton size="lg" disabled={!ready} onClick={() => { sfx.select(); go({ name: 'flashcard-player', topicIds: selected }); }}>
          ▶ {ready ? `Tráo ${selected.length} chủ đề` : `Chọn thêm ${minTopics - selected.length} chủ đề`}
        </PressButton>
      </footer>

      <FlashcardSettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </main>
  );
}
