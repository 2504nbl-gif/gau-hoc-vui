import type { DiscoveryLesson } from '@/types/curriculum';
import type { Topic } from '@/types/content';
import { FAMILY_TOPIC_ID, getTopic, TOPICS } from './index';

/** Chủ đề có hình rõ ràng — hợp cho trò chơi chọn hình của bé chưa biết chữ. */
export const PICTURE_TOPIC_IDS = TOPICS.filter((t) => !['letters', 'numbers', 'time'].includes(t.group)).map((t) => t.id);
/** `withFamily`: thêm chủ đề ảnh gia đình (nếu có) — chỉ dùng cho trò chọn hình, không dùng cho trò bóng/xoay. */
export const pictureTopics = (withFamily = false): Topic[] =>
  [...(withFamily ? [FAMILY_TOPIC_ID] : []), ...PICTURE_TOPIC_IDS].map((id) => getTopic(id)).filter((t): t is Topic => Boolean(t) && (t!.id !== FAMILY_TOPIC_ID || t!.items.length >= 3));

/** Chia chủ đề thành các bài 3 từ. Phần lẻ cuối được ghép thêm từ đầu chủ đề cho đủ 3. */
export function discoveryLessons(topic: Topic): DiscoveryLesson[] {
  const ids = topic.items.map((i) => i.id);
  const lessons: DiscoveryLesson[] = [];
  for (let i = 0; i < ids.length; i += 3) {
    const group = ids.slice(i, i + 3);
    for (let k = 0; group.length < 3; k++) group.push(ids[k]);
    lessons.push({ id: `${topic.id}-${lessons.length + 1}`, topicId: topic.id, targetIds: group as [string, string, string] });
  }
  return lessons;
}

export const findItem = (topicId: string, itemId: string) => getTopic(topicId)?.items.find((i) => i.id === itemId);

export type SceneId = 'ocean' | 'jungle' | 'farm';
export interface SceneDef {
  id: SceneId;
  title: string;
  topicId: string;
  icon: string;
  /** Nền vẽ bằng CSS (không cần ảnh). */
  background: string;
  /** Đồ trang trí rải trong cảnh: [emoji, x%, y%, cỡ vh]. */
  decor: [string, number, number, number][];
  /** Cách con vật chuyển động trong trò "tìm". */
  motion: 'swim' | 'peek' | 'walk';
}

export const SCENES: Record<SceneId, SceneDef> = {
  ocean: {
    id: 'ocean', title: 'Đại dương', topicId: 'sea', icon: '🌊', motion: 'swim',
    background: 'radial-gradient(120% 60% at 50% 0%, #8fd8ff 0%, transparent 60%), linear-gradient(#5cc4f5 0%, #2f8fd8 55%, #1f6fb8 85%, #e9d29a 85%, #dcc07f 100%)',
    decor: [['🪸', 6, 80, 9], ['🌿', 20, 82, 10], ['🪨', 40, 86, 6], ['🌿', 62, 81, 11], ['🪸', 82, 80, 9], ['🐚', 92, 89, 4], ['⭐', 30, 90, 3]],
  },
  jungle: {
    id: 'jungle', title: 'Rừng rậm', topicId: 'wild', icon: '🌴', motion: 'peek',
    background: 'linear-gradient(#bfe9a8 0%, #8fd16a 45%, #5fae45 75%, #4a9437 100%)',
    decor: [['🌳', 4, 30, 16], ['🌴', 22, 22, 18], ['🌳', 50, 26, 15], ['🌴', 74, 20, 18], ['🌳', 92, 32, 15], ['🌿', 12, 82, 9], ['🍃', 38, 86, 7], ['🌿', 66, 84, 9], ['🌺', 86, 86, 6]],
  },
  farm: {
    id: 'farm', title: 'Nông trại', topicId: 'pets', icon: '🏡', motion: 'walk',
    background: 'linear-gradient(#cfefff 0%, #e8f7ff 45%, #a8da72 45%, #8fcb5c 100%)',
    decor: [['🏡', 10, 30, 16], ['🌳', 30, 32, 13], ['🌻', 50, 52, 6], ['🌾', 72, 50, 8], ['🌳', 90, 33, 13], ['☀️', 84, 8, 8], ['☁️', 40, 8, 8]],
  },
};

export const SCENE_TOPICS = TOPICS.filter((t) => Object.values(SCENES).some((s) => s.topicId === t.id));
