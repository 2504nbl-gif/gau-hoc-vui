import type { CSSProperties } from 'react';
import { EMOJI_IMAGES } from '@/data/emojiIndex';

/** Mã tệp hình: các codepoint (bỏ FE0F) nối bằng '-'. Phải khớp key() trong scripts/build_emoji_images.py */
export function emojiKey(glyph: string): string {
  return Array.from(glyph)
    .filter((c) => c !== '️')
    .map((c) => c.codePointAt(0)!.toString(16))
    .join('-');
}

/**
 * Hiện emoji bằng hình 3D Fluent Emoji (Microsoft, MIT) nếu có, không thì dùng chữ emoji gốc.
 * Kích thước 1em → theo font-size hiện tại (hoặc `size` nếu truyền), thay thế trực tiếp cho chữ emoji.
 */
export function Emoji({ glyph, size, className = '', style }: { glyph: string; size?: string; className?: string; style?: CSSProperties }) {
  const key = emojiKey(glyph);
  const s: CSSProperties = { lineHeight: 1, ...(size ? { fontSize: size } : null), ...style };
  if (!EMOJI_IMAGES.has(key)) return <span className={className} style={s} aria-hidden>{glyph}</span>;
  return (
    <img
      src={`emoji/${key}.webp`}
      alt=""
      aria-hidden
      draggable={false}
      className={`inline-block select-none ${className}`}
      style={{ width: '1em', height: '1em', objectFit: 'contain', verticalAlign: '-0.12em', ...s }}
    />
  );
}

/** Chuỗi có thể chứa emoji lẫn chữ (vd "🐄 Nông trại"): thay từng emoji bằng hình. */
const EMOJI_SPLIT = /(\p{Extended_Pictographic}️?(?:‍\p{Extended_Pictographic}️?)*)/u;
export function EmojiText({ text }: { text: string }) {
  return <>{text.split(EMOJI_SPLIT).map((p, i) => (i % 2 ? <Emoji key={i} glyph={p} /> : p))}</>;
}
