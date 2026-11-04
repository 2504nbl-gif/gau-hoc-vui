import { create } from 'zustand';
import type { ModuleId } from '@/types/curriculum';

/** Các màn hình. Mỗi giai đoạn thêm route mới vào đây. */
export type Route = (
  | { name: 'dashboard' }
  | { name: 'daily' }
  | { name: 'flashcards' }
  | { name: 'flashcard-player'; topicIds: string[] }
  | { name: 'discovery'; topicId?: string }
  | { name: 'magnifier'; topicId: string; lesson: number }
  | { name: 'hub'; module: ModuleId }
  | { name: 'play'; game: string; arg?: string }
  | { name: 'stories' }
  | { name: 'story-player'; storyId: string }
  | { name: 'listen-find'; topicId?: string }
  | { name: 'scene-hunt'; scene: 'ocean' | 'jungle' }
  | { name: 'sticker' }
  | { name: 'parent' }
  | { name: 'sticker-book' }
  | { name: 'family-photos' }
) & {
  /** Mở từ "Bài học hôm nay": mọi lối thoát của hoạt động này đều quay về đường đi. */
  fromDaily?: boolean;
};

interface Nav {
  route: Route;
  go: (r: Route) => void;
}

export const useNav = create<Nav>((set) => ({
  route: { name: 'dashboard' },
  // Đang ở một chặng của Bài học hôm nay mà hoạt động tự thoát (về hub, thư viện, chọn chủ đề…)
  // thì quay về đường đi — nhờ vậy không phải sửa từng trò.
  go: (route) => set((s) => ({
    route: s.route.fromDaily && !route.fromDaily && route.name !== 'dashboard' ? { name: 'daily' } : route,
  })),
}));
