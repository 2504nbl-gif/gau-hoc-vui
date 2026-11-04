// ─────────────────────────────────────────────────────────────
// Lộ trình: 3 phân hệ → các module → bài học / mini-game.
// Dashboard đọc danh sách module từ đây; module chưa làm có status 'planned'.
// ─────────────────────────────────────────────────────────────
import type { ShapeId } from './content';

export type SubjectId = 'language' | 'cognitive' | 'art-math';
export type Level = 'easy' | 'medium' | 'hard';
export type ModuleStatus = 'ready' | 'planned';

export type ModuleId =
  | 'flashcards' | 'discovery' | 'language-games'          // Phân hệ 1
  | 'observation' | 'fine-motor' | 'memory'                // Phân hệ 2
  | 'art' | 'music' | 'math';                              // Phân hệ 3

export interface Subject {
  id: SubjectId;
  title: string;
  modules: ModuleId[];
}

export interface ModuleDef {
  id: ModuleId;
  subject: SubjectId;
  title: string;
  icon: string;
  /** Tên màu trong theme (xem styles/index.css). */
  color: 'coral' | 'leaf' | 'sea' | 'sun' | 'teal' | 'grape' | 'berry' | 'sky' | 'peach';
  phase: 1 | 2 | 3 | 4;
  status: ModuleStatus;
}

/** Bài Nhận biết: 3 từ mục tiêu trong 1 chủ đề. */
export interface DiscoveryLesson {
  id: string;
  topicId: string;
  targetIds: [string, string, string];
}

export type NoteName = 'C4' | 'D4' | 'E4' | 'F4' | 'G4' | 'A4' | 'B4' | 'C5';

/**
 * Cấu hình mini-game. Mỗi game là 1 nhánh có `type` riêng,
 * TypeScript sẽ báo lỗi nếu thiếu trường khi tạo bài mới.
 */
export type MiniGameConfig = { id: string; level: Level } & (
  // Phân hệ 1 — Ngôn ngữ
  | { type: 'magnifier'; lessonId: string; lensRadius: number }
  | { type: 'listen-find'; topicId: string; rounds: number; choices: 3 | 4 }
  | { type: 'sticker'; sceneId: 'ocean' | 'jungle' | 'farm'; stickerIds: string[] }
  | { type: 'story-player'; storyId: string; karaoke: boolean }
  // Phân hệ 2 — Tư duy
  | { type: 'shadow-match'; topicId: string; pairs: number }
  | { type: 'hidden-count'; topicId: string; maxCount: number }
  | { type: 'sequence'; recipe: 'sandwich' | 'ice-cream'; layers: string[] }
  | { type: 'color-tower'; rings: number }
  | { type: 'rotate-grid'; image: string; grid: 2; allowed: (90 | 180 | 270)[] }
  | { type: 'thread-needle'; path: string; tolerancePx: number }
  | { type: 'memory'; topicId: string; grid: '2x2' | '2x3' | '3x4' }
  // Phân hệ 3 — Nghệ thuật & Toán
  | { type: 'trace'; target: ShapeId | `digit-${number}`; arrows: boolean }
  | { type: 'coloring'; pageId: string }
  | { type: 'sound-quiz'; soundIds: string[]; choices: 3 | 4 }
  | { type: 'piano-drag'; notes: NoteName[] }
  | { type: 'number-intro'; digit: number }
  | { type: 'count-pick'; maxCount: number }
  | { type: 'missing-number'; length: number; max: number }
  | { type: 'compare'; maxCount: number; signs: ('<' | '>' | '=')[] }
);

export type MiniGameType = MiniGameConfig['type'];
