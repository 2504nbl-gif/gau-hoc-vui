import { useId } from 'react';

// Tất / găng tay / giày vẽ bằng SVG, tham số hóa màu + họa tiết — dùng cho trò "Tìm đôi".

export type PairKind = 'sock' | 'mitten' | 'shoe';
export type Pattern = 'dots' | 'stripes' | 'hearts';
export interface PairLook { kind: PairKind; color: string; pattern: Pattern }

const INK = '#2b3a4f';
const HEART = 'M0 -2 C0 -6 -6 -6 -6 -2 C-6 2 0 5 0 7 C0 5 6 2 6 -2 C6 -6 0 -6 0 -2 Z';

/** Các mảnh của từng loại (vẽ lần lượt, mảnh sau đè mảnh trước). `band` = phần cổ/viền màu nhạt. */
const SHAPES: Record<PairKind, { parts: string[]; band?: [number, number, number, number] }> = {
  sock: {
    parts: ['M34 6 H74 V70 L100 80 Q116 88 110 104 Q104 116 88 112 L46 102 Q32 98 33 84 Z'],
    band: [30, 4, 50, 18],
  },
  mitten: {
    parts: [
      'M22 84 Q8 74 12 56 Q16 44 28 48 Q38 52 40 66 Z',
      'M36 114 V54 Q36 10 66 10 Q96 10 96 50 V114 Z',
    ],
    band: [32, 94, 70, 22],
  },
  shoe: {
    parts: ['M8 94 V62 Q8 46 24 46 H48 Q56 32 70 32 H80 Q90 52 106 64 Q116 72 114 88 V94 Z'],
  },
};

/** Một chiếc tất/găng/giày. `size` là cạnh hình vuông (CSS). */
export function PairItem({ look, size }: { look: PairLook; size: string }) {
  const uid = useId().replace(/:/g, '');
  const { parts, band } = SHAPES[look.kind];
  const pat = `p${uid}`;
  return (
    <svg viewBox="0 0 120 120" style={{ width: size, height: size }} aria-hidden>
      <defs>
        <pattern id={pat} width="20" height="20" patternUnits="userSpaceOnUse">
          {look.pattern === 'dots' && <><circle cx="5" cy="5" r="3.6" fill="#fff" /><circle cx="15" cy="15" r="3.6" fill="#fff" /></>}
          {look.pattern === 'stripes' && <rect x="0" y="0" width="20" height="8" fill="#fff" opacity=".9" />}
          {look.pattern === 'hearts' && <path d={HEART} transform="translate(10 9)" fill="#fff" />}
        </pattern>
        {parts.map((d, i) => <clipPath key={i} id={`c${uid}${i}`}><path d={d} /></clipPath>)}
      </defs>
      {parts.map((d, i) => (
        <g key={i}>
          <g clipPath={`url(#c${uid}${i})`}>
            <rect width="120" height="120" fill={look.color} />
            <rect width="120" height="120" fill={`url(#${pat})`} />
            {band && <rect x={band[0]} y={band[1]} width={band[2]} height={band[3]} fill="#fff" opacity=".75" />}
            {band && <rect x={band[0]} y={band[1]} width={band[2]} height={band[3]} fill={look.color} opacity=".35" />}
          </g>
          <path d={d} fill="none" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        </g>
      ))}
      {look.kind === 'shoe' && (
        <>
          <rect x="4" y="92" width="114" height="14" rx="7" fill="#fff" stroke={INK} strokeWidth="3.5" />
          <path d="M50 50 l10 8 M56 44 l10 8 M62 38 l10 8" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
