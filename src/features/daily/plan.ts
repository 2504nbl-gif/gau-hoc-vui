// Lập "Bài học hôm nay": 5 chặng nối tiếp lấy từ nội dung có sẵn, cố định trong ngày (seed theo ngày).
// Chỉ là dữ liệu + hàm thuần; trạng thái (đã xong, chuỗi ngày) nằm ở store/useDailyStore.
import { getTopic, topicSupports } from '@/data';
import { pictureTopics } from '@/data/games';
import { STORIES } from '@/data/stories';
import { GAME_META } from '@/data/gameList';
import { shuffle } from '@/features/flashcards/buildDeck';
import type { Route } from '@/store/useNav';
import type { Visual } from '@/types/content';

/** cards = xem thẻ · listen = Nghe và tìm (cùng chủ đề) · story = thơ/truyện · think = trò tư duy · skill = toán/nhạc/vẽ */
export type StepKind = 'cards' | 'listen' | 'story' | 'think' | 'skill';
export interface PlanStep { kind: StepKind; ref: string }

/** Trò tư duy (quan sát, ghi nhớ, vận động tinh) hợp với bé nhỏ. */
const THINK_GAMES = ['shadow-match', 'hidden-count', 'sequence', 'color-tower', 'rotate-grid', 'memory-2x2', 'dress-up', 'thread-needle', 'color-sort', 'mom-baby',
  'sock-pair', 'cup-shuffle', 'curtain', 'hammer-nails'];
/** Toán, nhạc, vẽ. */
const SKILL_GAMES = ['egg-count', 'flower-pot', 'trace-shapes', 'piano-drag', 'sound-quiz', 'big-small'];
// Nhóm trò 3 tuổi (features/early): ngôn ngữ + cảm xúc vào chặng tư duy, toán sớm vào chặng kỹ năng.
THINK_GAMES.push('where-bear', 'opposites', 'how-feel');
SKILL_GAMES.push('share-treats', 'balance-scale', 'count-touch');

/** Ngày theo giờ máy, dạng 2026-11-04. */
export function dayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Cộng/trừ ngày cho một dayKey. */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}

/** Số ngẫu nhiên cố định theo chuỗi (mulberry32). */
function seeded(key: string): () => number {
  let a = 2166136261;
  for (let i = 0; i < key.length; i++) a = Math.imul(a ^ key.charCodeAt(i), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Chọn mục điểm thấp nhất (bé ít gặp), tránh mục vừa dùng mấy ngày trước; hòa thì bốc thăm theo ngày. */
function pickLeast(ids: string[], score: (id: string) => number, avoid: Set<string>, rand: () => number): string {
  const fresh = ids.filter((id) => !avoid.has(id));
  const pool = shuffle(fresh.length ? fresh : ids, rand);
  return pool.sort((a, b) => score(a) - score(b))[0];
}

export interface PlanInput {
  flashcardViews: Record<string, number>;
  gameResults: Record<string, number>;
  /** Mục đã có trong lộ trình các ngày trước, mới nhất trước: [[ref của hôm qua], [hôm kia]…]. */
  recent: PlanStep[][];
}

/** Lộ trình của một ngày. Cùng ngày + cùng tiến độ → cùng kết quả. */
export function buildPlan(day: string, { flashcardViews, gameResults, recent }: PlanInput): PlanStep[] {
  const rand = seeded(`gau-${day}`);
  const usedIn = (days: number, kinds: StepKind[]) =>
    new Set(recent.slice(0, days).flat().filter((s) => kinds.includes(s.kind)).map((s) => s.ref));

  const topics = pictureTopics().filter((t) => topicSupports(t, 'vi') && t.items.length >= 3).map((t) => t.id);
  const topic = pickLeast(topics, (id) => flashcardViews[id] ?? 0, usedIn(3, ['cards']), rand);

  const stories = STORIES.filter((s) => s.lang === 'vi').map((s) => s.id);
  const story = pickLeast(stories, () => 0, usedIn(14, ['story']), rand);

  const gameScore = (id: string) => gameResults[id] ?? 0;
  const known = (ids: string[]) => ids.filter((id) => GAME_META.some((g) => g.id === id));
  const think = pickLeast(known(THINK_GAMES), gameScore, usedIn(2, ['think']), rand);
  const skill = pickLeast(known(SKILL_GAMES), gameScore, usedIn(2, ['skill']), rand);

  return [
    { kind: 'cards', ref: topic },
    { kind: 'listen', ref: topic },
    { kind: 'story', ref: story },
    { kind: 'think', ref: think },
    { kind: 'skill', ref: skill },
  ];
}

export interface StepInfo {
  /** Tên đọc lên khi bé chạm trạm (đã có trong gói giọng). */
  title: string;
  /** Dòng chữ nhỏ dưới trạm cho bố mẹ. */
  label: string;
  visual: Visual;
  badge: string;
  color: string;
  /** Màn hình mở ra (đã gắn cờ fromDaily). */
  route: Route;
}

const emoji = (value: string): Visual => ({ kind: 'emoji', value });
const SKILL_BADGE: Record<string, string> = { math: '🔢', music: '🎵', art: '🎨' };

/** Thông tin hiển thị của một chặng; undefined nếu nội dung không còn (vd chủ đề bị xóa). */
export function stepInfo(step: PlanStep): StepInfo | undefined {
  const { kind, ref } = step;
  if (kind === 'cards' || kind === 'listen') {
    const t = getTopic(ref);
    if (!t) return undefined;
    return kind === 'cards'
      ? { title: t.title.vi, label: `Xem thẻ · ${t.title.vi}`, visual: t.items[0].visual, badge: '🃏', color: 'coral',
          route: { name: 'flashcard-player', topicIds: [t.id], fromDaily: true } }
      : { title: 'Nghe và tìm', label: `Nghe và tìm · ${t.title.vi}`, visual: (t.items[1] ?? t.items[0]).visual, badge: '👂', color: 'sun',
          route: { name: 'listen-find', topicId: t.id, fromDaily: true } };
  }
  if (kind === 'story') {
    const s = STORIES.find((x) => x.id === ref);
    if (!s) return undefined;
    return { title: s.title, label: s.title, visual: s.cover, badge: '📖', color: 'sea',
      route: { name: 'story-player', storyId: s.id, fromDaily: true } };
  }
  const g = GAME_META.find((x) => x.id === ref);
  if (!g) return undefined;
  const route: Route = g.route ? { ...g.route, fromDaily: true } : { name: 'play', game: g.id, arg: g.arg, fromDaily: true };
  return { title: g.title, label: g.title, visual: emoji(g.icon), badge: kind === 'think' ? '🧩' : SKILL_BADGE[g.module] ?? '⭐', color: g.color, route };
}
