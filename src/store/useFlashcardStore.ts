import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_FLASHCARD_SETTINGS, FLASHCARD_LIMITS, type FlashcardSettings } from '@/types/settings';
import { getTopic, topicSupports } from '@/data';

interface FlashcardStore {
  settings: FlashcardSettings;
  /** Chủ đề bé đang chọn cho phiên tráo thẻ (nhớ lại cho lần sau). */
  selected: string[];
  update: (patch: Partial<FlashcardSettings>) => void;
  toggleTopic: (id: string) => 'added' | 'removed' | 'full';
}

export const useFlashcardStore = create<FlashcardStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_FLASHCARD_SETTINGS,
      selected: [],
      update: (patch) =>
        set((s) => {
          const settings = { ...s.settings, ...patch };
          // Đổi ngôn ngữ thì bỏ các chủ đề không có ngôn ngữ đó.
          const selected = s.selected.filter((id) => {
            const t = getTopic(id);
            return t && topicSupports(t, settings.lang);
          });
          return { settings, selected };
        }),
      toggleTopic: (id) => {
        const { selected } = get();
        if (selected.includes(id)) {
          set({ selected: selected.filter((x) => x !== id) });
          return 'removed';
        }
        if (selected.length >= FLASHCARD_LIMITS.maxTopics) return 'full';
        set({ selected: [...selected, id] });
        return 'added';
      },
    }),
    { name: 'gau-flashcards', version: 1 },
  ),
);
