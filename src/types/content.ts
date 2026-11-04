// ─────────────────────────────────────────────────────────────
// Nội dung học: chủ đề, từ vựng, hình minh họa, truyện/thơ
// Một VocabItem dùng chung cho mọi module (Tráo thẻ, Nhận biết,
// Nghe & Tìm, Tìm bóng, Lật thẻ…), nên chỉ khai báo nội dung 1 lần.
// ─────────────────────────────────────────────────────────────

export type Lang = 'vi' | 'en';

/** Chuỗi có bản Tiếng Việt và Tiếng Anh. */
export type Localized = Record<Lang, string>;

export type ShapeId =
  | 'circle' | 'square' | 'triangle' | 'rectangle' | 'star'
  | 'heart' | 'diamond' | 'hexagon' | 'oval' | 'pentagon' | 'arrow';

/** Cách vẽ hình của một thẻ. Thêm loại mới ở đây + 1 nhánh trong <CardVisual>. */
export type Visual =
  | { kind: 'emoji'; value: string }
  | { kind: 'glyph'; value: string; color?: string } // chữ cái, chữ số
  | { kind: 'dots'; count: number }                   // thẻ chấm Glenn Doman
  | { kind: 'shape'; shape: ShapeId; color: string }
  | { kind: 'clock'; hour: number }
  | { kind: 'color'; hex: string }
  | { kind: 'image'; src: string; alt?: string };     // ảnh thật (giai đoạn sau)

export interface VocabItem {
  id: string;
  label: Localized;
  /** Câu đọc khác nhãn hiển thị (vd chữ "ă" đọc là "á"). Bỏ trống = đọc nhãn. */
  speak?: Partial<Localized>;
  visual: Visual;
  /** File âm thanh thu sẵn, ưu tiên hơn giọng máy nếu có. */
  audio?: Partial<Record<Lang, string>>;
}

export type TopicGroup =
  | 'animals' | 'nature' | 'objects' | 'food' | 'vehicles'
  | 'letters' | 'numbers' | 'shapes' | 'colors' | 'time' | 'people';

export interface Topic {
  id: string;
  title: Localized;
  group: TopicGroup;
  /** Ngôn ngữ chủ đề hỗ trợ. Bảng chữ cái Việt chỉ có 'vi'. Bỏ trống = cả hai. */
  langs?: Lang[];
  items: VocabItem[];
}

/** Thơ / đồng dao / truyện (Giai đoạn 2). */
export interface Story {
  id: string;
  kind: 'poem' | 'rhyme' | 'folk' | 'story';
  title: string;
  lang: Lang;
  cover: Visual;
  /** Mỗi dòng là 1 câu; karaoke highlight theo từng chữ trong dòng. */
  lines: string[];
}
