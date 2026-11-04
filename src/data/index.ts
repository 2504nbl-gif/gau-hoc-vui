import type { Lang, Topic, VocabItem } from '@/types/content';
import { animalTopics } from './topics/animals';
import { everydayTopics } from './topics/everyday';
import { letterNumberTopics } from './topics/letters-numbers';
import { shapeColorTimeTopics } from './topics/shapes-colors-time';
import { moreTopics } from './topics/more';

/** Toàn bộ chủ đề. Thêm chủ đề mới: tạo file trong topics/ rồi nối vào đây. */
export const TOPICS: Topic[] = [...animalTopics, ...everydayTopics, ...moreTopics, ...letterNumberTopics, ...shapeColorTimeTopics];

const byId = new Map(TOPICS.map((t) => [t.id, t]));

/** Chủ đề ảnh gia đình (ảnh riêng trên máy, nạp lúc chạy — xem store/useFamilyStore). */
export const FAMILY_TOPIC_ID = 'my-family';
let familyTopic: Topic | null = null;
export const setFamilyTopic = (t: Topic | null) => { familyTopic = t; };

export const getTopic = (id: string) => byId.get(id) ?? (id === FAMILY_TOPIC_ID ? familyTopic ?? undefined : undefined);

export const topicSupports = (t: Topic, lang: Lang) => !t.langs || t.langs.includes(lang);

/** Câu máy sẽ đọc cho một thẻ. */
export const spokenText = (item: VocabItem, lang: Lang) => item.speak?.[lang] ?? item.label[lang];

export { MODULES, SUBJECTS } from './curriculum';
