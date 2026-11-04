import type { Topic, VocabItem } from '@/types/content';
import { EN_NUMBERS, VI_NUMBERS, cap } from '../build';

// Chữ cái Tiếng Việt và cách đọc tên chữ theo SGK.
const VI_ALPHABET: [string, string][] = [
  ['a', 'a'], ['ă', 'á'], ['â', 'ớ'], ['b', 'bê'], ['c', 'xê'], ['d', 'dê'], ['đ', 'đê'], ['e', 'e'], ['ê', 'ê'],
  ['g', 'giê'], ['h', 'hát'], ['i', 'i'], ['k', 'ca'], ['l', 'e lờ'], ['m', 'em mờ'], ['n', 'en nờ'], ['o', 'o'],
  ['ô', 'ô'], ['ơ', 'ơ'], ['p', 'pê'], ['q', 'quy'], ['r', 'e rờ'], ['s', 'ét xì'], ['t', 'tê'], ['u', 'u'],
  ['ư', 'ư'], ['v', 'vê'], ['x', 'ích xì'], ['y', 'i dài'],
];

const viLetters = (upper: boolean): VocabItem[] =>
  VI_ALPHABET.map(([ch, name], i) => {
    const g = upper ? ch.toUpperCase() : ch;
    return {
      id: `vi-${upper ? 'up' : 'low'}-${i + 1}`,
      label: { vi: `Chữ ${g}`, en: g },
      speak: { vi: `chữ ${name}${upper ? ' hoa' : ''}` },
      visual: { kind: 'glyph', value: g, color: upper ? '#2f6fd1' : '#d93a3a' },
    };
  });

const enLetters: VocabItem[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c, i) => ({
  id: `en-letter-${i + 1}`,
  label: { vi: `Chữ ${c}`, en: c },
  speak: { en: `${c}` },
  visual: { kind: 'glyph', value: c, color: '#7a4fd6' },
}));

export const letterNumberTopics: Topic[] = [
  { id: 'vi-lower', group: 'letters', langs: ['vi'], title: { vi: 'Bảng chữ cái thường', en: 'Vietnamese letters' }, items: viLetters(false) },
  { id: 'vi-upper', group: 'letters', langs: ['vi'], title: { vi: 'Bảng chữ cái hoa', en: 'Vietnamese capitals' }, items: viLetters(true) },
  { id: 'en-alphabet', group: 'letters', langs: ['en'], title: { vi: 'Chữ cái Tiếng Anh', en: 'Alphabet' }, items: enLetters },
  {
    id: 'dots', group: 'numbers', title: { vi: 'Thẻ chấm', en: 'Dot cards' },
    items: Array.from({ length: 10 }, (_, k) => {
      const n = k + 1;
      return { id: `dots-${n}`, label: { vi: cap(VI_NUMBERS[n]), en: cap(EN_NUMBERS[n]) }, visual: { kind: 'dots', count: n } };
    }),
  },
  {
    id: 'digits', group: 'numbers', title: { vi: 'Số đếm', en: 'Numbers' },
    items: Array.from({ length: 11 }, (_, n) => ({
      id: `digit-${n}`,
      label: { vi: `Số ${VI_NUMBERS[n]}`, en: cap(EN_NUMBERS[n]) },
      visual: { kind: 'glyph', value: String(n), color: '#e0547b' },
    })),
  },
];
