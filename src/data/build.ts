import type { VocabItem } from '@/types/content';

/**
 * Viết nhanh danh sách thẻ hình emoji: "🐶|Con chó|Dog; 🐱|Con mèo|Cat".
 * id = tiền tố + số thứ tự, cố định để lưu tiến độ không bị lệch.
 */
export function emojiItems(prefix: string, spec: string): VocabItem[] {
  return spec
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((row, i) => {
      const [value, vi, en] = row.split('|').map((x) => x.trim());
      return { id: `${prefix}-${i + 1}`, label: { vi, en }, visual: { kind: 'emoji', value } };
    });
}

export const VI_NUMBERS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'mười một', 'mười hai'];
export const EN_NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
