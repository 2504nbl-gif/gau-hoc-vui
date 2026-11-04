import type { ShapeId, Topic } from '@/types/content';
import { EN_NUMBERS, VI_NUMBERS } from '../build';

const SHAPES: [ShapeId, string, string, string][] = [
  ['circle', 'Hình tròn', 'Circle', '#ee7c5f'],
  ['square', 'Hình vuông', 'Square', '#4b9cef'],
  ['triangle', 'Hình tam giác', 'Triangle', '#4db463'],
  ['rectangle', 'Hình chữ nhật', 'Rectangle', '#f2b23a'],
  ['star', 'Ngôi sao', 'Star', '#f5c518'],
  ['heart', 'Trái tim', 'Heart', '#e0547b'],
  ['diamond', 'Hình thoi', 'Diamond', '#8d71e8'],
  ['hexagon', 'Hình lục giác', 'Hexagon', '#2bb0a3'],
  ['oval', 'Hình bầu dục', 'Oval', '#f08a3c'],
  ['pentagon', 'Hình ngũ giác', 'Pentagon', '#5c7cfa'],
];

const COLORS: [string, string, string][] = [
  ['#e53935', 'Màu đỏ', 'Red'], ['#fb8c00', 'Màu cam', 'Orange'], ['#fdd835', 'Màu vàng', 'Yellow'],
  ['#43a047', 'Màu xanh lá', 'Green'], ['#1e88e5', 'Màu xanh dương', 'Blue'], ['#8e24aa', 'Màu tím', 'Purple'],
  ['#f06ea9', 'Màu hồng', 'Pink'], ['#8d5a3b', 'Màu nâu', 'Brown'], ['#222222', 'Màu đen', 'Black'], ['#ffffff', 'Màu trắng', 'White'],
];

export const shapeColorTimeTopics: Topic[] = [
  {
    id: 'shapes', group: 'shapes', title: { vi: 'Hình 2D', en: '2D shapes' },
    items: SHAPES.map(([shape, vi, en, color]) => ({ id: `shape-${shape}`, label: { vi, en }, visual: { kind: 'shape', shape, color } })),
  },
  {
    id: 'colors', group: 'colors', title: { vi: 'Màu sắc', en: 'Colors' },
    items: COLORS.map(([hex, vi, en]) => ({ id: `color-${en.toLowerCase()}`, label: { vi, en }, visual: { kind: 'color', hex } })),
  },
  {
    id: 'clock', group: 'time', title: { vi: 'Đồng hồ', en: 'Clock' },
    items: Array.from({ length: 12 }, (_, k) => {
      const h = k + 1;
      return {
        id: `clock-${h}`,
        label: { vi: `${h} giờ`, en: `${h} o'clock` },
        speak: { vi: `${VI_NUMBERS[h]} giờ`, en: `${EN_NUMBERS[h]} o'clock` },
        visual: { kind: 'clock', hour: h },
      };
    }),
  },
];
