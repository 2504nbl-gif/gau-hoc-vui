import { getTopic } from '@/data';
import type { Topic, VocabItem } from '@/types/content';
import type { FlashcardSettings } from '@/types/settings';

export interface DeckCard { topic: Topic; item: VocabItem; indexInTopic: number; topicSize: number }

export function shuffle<T>(arr: readonly T[], rand = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Tạo bộ thẻ cho một phiên: đi lần lượt từng chủ đề (theo phương pháp Doman,
 * mỗi chủ đề là một "bộ"), mỗi chủ đề lấy `cardsPerTopic` thẻ, trộn hoặc giữ thứ tự.
 */
export function buildDeck(topicIds: string[], s: Pick<FlashcardSettings, 'cardsPerTopic' | 'order'>, rand = Math.random): DeckCard[] {
  return topicIds.flatMap((id) => {
    const topic = getTopic(id);
    if (!topic) return [];
    const ordered = s.order === 'shuffle' ? shuffle(topic.items, rand) : topic.items;
    const picked = ordered.slice(0, s.cardsPerTopic);
    return picked.map((item, i) => ({ topic, item, indexInTopic: i + 1, topicSize: picked.length }));
  });
}
