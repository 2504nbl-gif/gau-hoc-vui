import type { ModuleId } from './curriculum';

export interface ProgressState {
  childName: string;
  stars: number;
  /** Số lần đã xem mỗi chủ đề trong Tráo thẻ. */
  flashcardViews: Record<string, number>;
  /** Mini-game đã hoàn thành (id → số sao 1–3). Dùng từ Giai đoạn 2. */
  gameResults: Record<string, 1 | 2 | 3>;
  lastModule?: ModuleId;
  /** Nhật ký theo ngày (khóa YYYY-MM-DD giờ máy): số lượt hoàn thành, giây đã chơi, sao. Giữ 60 ngày. */
  daily: Record<string, DayLog>;
  /** Thống kê từng bài (id kết quả → số lượt, số lượt đúng ngay lần đầu / tổng lượt). */
  gameStats: Record<string, GameStat>;
}

export interface DayLog { plays: number; seconds: number; stars: number }
export interface GameStat { plays: number; correct: number; total: number }
