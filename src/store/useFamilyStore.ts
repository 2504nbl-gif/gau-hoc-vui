import { create } from 'zustand';
import type { Topic } from '@/types/content';
import { FAMILY_TOPIC_ID, setFamilyTopic } from '@/data';
import { PHRASES } from '@/data/phrases';
import { listPhotos, type FamilyPhoto } from '@/services/storage/family';
import { useFlashcardStore } from './useFlashcardStore';

export interface FamilyPhotoView extends FamilyPhoto { url: string }

interface FamilyStore {
  photos: FamilyPhotoView[];
  /** Chủ đề "Gia đình của Gấu" — null khi chưa có ảnh (chủ đề ẩn). */
  topic: Topic | null;
  /** Đọc lại ảnh từ IndexedDB (gọi lúc mở app và sau mỗi lần thêm/xóa). */
  load: () => Promise<void>;
}

/** Ảnh gia đình đang có trên máy, kèm object URL để hiển thị. Không lưu localStorage. */
export const useFamilyStore = create<FamilyStore>((set, get) => ({
  photos: [],
  topic: null,
  load: async () => {
    let list: FamilyPhoto[] = [];
    try { list = await listPhotos(); } catch { /* trình duyệt không có IndexedDB → coi như chưa có ảnh */ }
    get().photos.forEach((p) => URL.revokeObjectURL(p.url));
    const photos = list.map((p) => ({ ...p, url: URL.createObjectURL(p.blob) }));
    const topic: Topic | null = photos.length
      ? {
          id: FAMILY_TOPIC_ID,
          group: 'people',
          title: { vi: PHRASES.familyTopic, en: 'My family' },
          langs: ['vi'],
          items: photos.map((p) => ({
            id: `${FAMILY_TOPIC_ID}-${p.id}`,
            label: { vi: p.label, en: p.label },
            ...(p.speak ? { speak: { vi: p.speak } } : {}),
            visual: { kind: 'image', src: p.url, alt: p.label },
          })),
        }
      : null;
    setFamilyTopic(topic);
    if (!topic) useFlashcardStore.setState((s) => ({ selected: s.selected.filter((id) => id !== FAMILY_TOPIC_ID) }));
    set({ photos, topic });
  },
}));
