import type { Lang } from './content';

export type CardFace = 'image' | 'text' | 'both';
export type CardOrder = 'shuffle' | 'fixed';
export type PlayMode = 'auto' | 'manual';

export interface FlashcardSettings {
  lang: Lang;
  face: CardFace;
  order: CardOrder;
  mode: PlayMode;
  /** Thời gian mỗi thẻ ở chế độ tự động (ms). Chuẩn Glenn Doman: 1000. */
  intervalMs: number;
  /** 5–10 thẻ cho mỗi chủ đề trong một phiên. */
  cardsPerTopic: number;
  /** Tự đọc tên khi thẻ xuất hiện. */
  speak: boolean;
}

export const FLASHCARD_LIMITS = {
  minTopics: 3,
  maxTopics: 5,
  minCards: 5,
  maxCards: 10,
  intervals: [1000, 1500, 2000],
} as const;

export const DEFAULT_FLASHCARD_SETTINGS: FlashcardSettings = {
  lang: 'vi',
  face: 'both',
  order: 'shuffle',
  mode: 'auto',
  intervalMs: 1000,
  cardsPerTopic: 10,
  speak: true,
};
