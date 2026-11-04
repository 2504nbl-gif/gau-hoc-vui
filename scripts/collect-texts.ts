// Gom mọi câu tiếng Việt cần thu giọng → scripts/voice-texts.json
// Mỗi "sprite" là một file âm thanh gộp nhiều câu (1 chủ đề, 1 bài thơ, hoặc câu giao diện).
import { writeFileSync } from 'node:fs';
import { TOPICS, spokenText, topicSupports } from '../src/data/index';
import { MODULES } from '../src/data/curriculum';
import { STORIES } from '../src/data/stories';
import { fixedPhrases } from '../src/data/phrases';
import { GAME_META } from '../src/data/gameList';
import { CLOTHES, INGREDIENTS, SCOOPS } from '../src/data/cognitive';
import { COLORING_PAGES, DIGITS, TRACE_SHAPES, digitName, looksLikeSentence } from '../src/data/art';
import { SOUNDS } from '../src/services/audio/soundBank';
import { NOTE_LABEL } from '../src/services/audio/sfx';
import { FLASHCARD_LIMITS } from '../src/types/settings';

type Job = { id: string; texts: string[]; words?: boolean };
const jobs: Job[] = [];

const topicTitles = TOPICS.filter((t) => topicSupports(t, 'vi')).map((t) => t.title.vi);
const gameTexts = [
  ...GAME_META.map((g) => g.title), ...SOUNDS.map((x) => x.name), ...INGREDIENTS.map((x) => x.name), ...SCOOPS.map((x) => x.name),
  ...CLOTHES.map((x) => x.name), ...Object.values(NOTE_LABEL), ...COLORING_PAGES.map((p) => p.name), ...TRACE_SHAPES.map((x) => x.name),
  ...DIGITS.flatMap((d) => [digitName(d.n), looksLikeSentence(d.n)]),
];
jobs.push({ id: 'ui', texts: [...fixedPhrases(MODULES.map((m) => m.title), FLASHCARD_LIMITS.maxTopics, gameTexts), ...topicTitles, ...STORIES.map((s) => s.title)] });

for (const t of TOPICS) {
  if (!topicSupports(t, 'vi')) continue;
  jobs.push({ id: `topic-${t.id}`, texts: t.items.map((i) => spokenText(i, 'vi')) });
}
for (const s of STORIES.filter((x) => x.lang === 'vi')) {
  // Thơ/truyện cần mốc thời gian từng chữ cho karaoke.
  jobs.push({ id: `story-${s.id}`, texts: [s.title, ...s.lines], words: true });
}

for (const j of jobs) j.texts = [...new Set(j.texts)];
writeFileSync(new URL('./voice-texts.json', import.meta.url), JSON.stringify(jobs, null, 1));
console.log(`${jobs.length} nhóm, ${jobs.reduce((n, j) => n + j.texts.length, 0)} câu → scripts/voice-texts.json`);
