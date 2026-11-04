import type { ShapeId, Visual } from '@/types/content';
import { Emoji } from './Emoji';

const SHAPE_SVG: Record<ShapeId, string> = {
  circle: '<circle cx="50" cy="50" r="42"/>',
  square: '<rect x="10" y="10" width="80" height="80" rx="4"/>',
  triangle: '<polygon points="50,8 94,90 6,90"/>',
  rectangle: '<rect x="4" y="24" width="92" height="52" rx="4"/>',
  star: '<polygon points="50,5 61,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 39,38"/>',
  heart: '<path d="M50 90C10 62 4 40 18 24C30 10 46 16 50 30C54 16 70 10 82 24C96 40 90 62 50 90Z"/>',
  diamond: '<polygon points="50,4 88,50 50,96 12,50"/>',
  hexagon: '<polygon points="27,8 73,8 96,50 73,92 27,92 4,50"/>',
  oval: '<ellipse cx="50" cy="50" rx="46" ry="30"/>',
  pentagon: '<polygon points="50,5 95,38 78,92 22,92 5,38"/>',
  arrow: '<polygon points="6,38 58,38 58,16 94,50 58,84 58,62 6,62"/>',
};

// Thứ tự ô để chấm rải đều, không thành hàng (kiểu thẻ chấm Doman). Lưới 4×3.
const DOT_ORDER = [5, 2, 8, 0, 11, 6, 3, 9, 1, 10, 4, 7];

/**
 * Vẽ hình của một thẻ. `size` là độ dài CSS (vd "min(50vh,40vw)").
 * Dùng chung cho Tráo thẻ và mọi mini-game sau này.
 */
export function CardVisual({ visual, size }: { visual: Visual; size: string }) {
  switch (visual.kind) {
    case 'emoji':
      return <Emoji glyph={visual.value} size={size} />;
    case 'glyph':
      return (
        <span className="font-display font-extrabold" style={{ fontSize: size, lineHeight: 1, color: visual.color ?? 'var(--color-doman)' }}>
          {visual.value}
        </span>
      );
    case 'dots':
      return (
        <svg viewBox="0 0 100 76" style={{ width: `calc(${size} * 1.3)` }} aria-hidden>
          {DOT_ORDER.slice(0, visual.count).map((k) => (
            <circle key={k} cx={14 + (k % 4) * 24} cy={14 + Math.floor(k / 4) * 24} r={9.5} fill="#e53935" />
          ))}
        </svg>
      );
    case 'shape':
      return (
        <svg viewBox="0 0 100 100" style={{ width: size }} fill={visual.color} aria-hidden
          dangerouslySetInnerHTML={{ __html: SHAPE_SVG[visual.shape] }} />
      );
    case 'color':
      return (
        <span
          style={{ width: `calc(${size} * 1.2)`, height: size, background: visual.hex }}
          className="block rounded-[22%] border-4 border-line"
          aria-hidden
        />
      );
    case 'clock':
      return <Clock hour={visual.hour} size={size} />;
    case 'image':
      return <img src={visual.src} alt={visual.alt ?? ''} style={{ height: size, objectFit: 'contain', borderRadius: '14%' }} draggable={false} />;
  }
}

function Clock({ hour, size }: { hour: number; size: string }) {
  const nums: [string, number, number][] = [['12', 50, 24], ['3', 78, 54], ['6', 50, 84], ['9', 22, 54]];
  return (
    <svg viewBox="0 0 100 100" style={{ width: size }} aria-hidden>
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="#4b9cef" strokeWidth="6" />
      {Array.from({ length: 12 }, (_, i) => {
        const r = (i * 30 * Math.PI) / 180;
        return <circle key={i} cx={50 + 38 * Math.sin(r)} cy={50 - 38 * Math.cos(r)} r={i % 3 ? 1.8 : 3} fill="#2b3a4f" />;
      })}
      {nums.map(([t, x, y]) => (
        <text key={t} x={x} y={y} fontSize="11" textAnchor="middle" fontWeight="800" fill="#2b3a4f" fontFamily="Nunito, sans-serif">{t}</text>
      ))}
      <line x1="50" y1="50" x2="50" y2="16" stroke="#4b9cef" strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="50" x2="50" y2="28" stroke="#e0547b" strokeWidth="6" strokeLinecap="round" transform={`rotate(${(hour % 12) * 30} 50 50)`} />
      <circle cx="50" cy="50" r="4" fill="#2b3a4f" />
    </svg>
  );
}
