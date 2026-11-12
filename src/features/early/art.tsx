// Hình vẽ riêng của nhóm trò "early": tranh vị trí (gấu + bàn/hộp), cốc nước đầy/vơi, cây cao/thấp.
import { BearMascot } from '@/components/content/BearMascot';
import { Emoji } from '@/components/content/Emoji';
import type { OppositeArt, Place } from '@/data/early';

/** Vị trí gấu trong khung 200×150: tâm x, mép dưới y; dx = dịch đồ vật sang trái để chừa chỗ "bên cạnh". */
const BEAR = 48;
const SPOT: Record<string, { x: number; bottom: number; dx?: number }> = {
  'on-table': { x: 100, bottom: 64 },
  'under-table': { x: 100, bottom: 137 },
  'beside-table': { x: 166, bottom: 137, dx: -28 },
  'in-box': { x: 100, bottom: 96 },
  'on-box': { x: 100, bottom: 82 },
  'beside-box': { x: 154, bottom: 137, dx: -32 },
};

/** Tranh "Gấu ở trên bàn / dưới bàn / trong hộp / cạnh hộp…": đồ vật vẽ SVG, gấu là linh vật của app. */
export function PlaceScene({ place }: { place: Place }) {
  const p = SPOT[place.id];
  const move = `translate(${p.dx ?? 0} 0)`;
  const open = place.spot === 'in';
  return (
    <svg viewBox="0 0 200 150" className="size-full" aria-hidden>
      <rect x="4" y="4" width="192" height="142" rx="16" fill="#eef8ff" />
      <path d="M4 124 H196 V130 A16 16 0 0 1 180 146 H20 A16 16 0 0 1 4 130 Z" fill="#bfe3a4" />
      {place.furniture === 'table' ? (
        <g transform={move}>
          <rect x="50" y="72" width="9" height="65" rx="3" fill="#a8693f" />
          <rect x="141" y="72" width="9" height="65" rx="3" fill="#a8693f" />
          <rect x="38" y="62" width="124" height="13" rx="5" fill="#c58a52" />
          <rect x="40" y="63" width="120" height="4" rx="2" fill="#e0ad7a" />
        </g>
      ) : open && (
        // Lòng hộp và hai nắp mở, vẽ sau lưng gấu
        <g transform={move}>
          <rect x="64" y="68" width="72" height="22" fill="#a97c45" />
          <path d="M64 82 L44 68 L50 60 L64 68 Z M136 82 L156 68 L150 60 L136 68 Z" fill="#d9a968" />
        </g>
      )}
      <BearMascot x={p.x - BEAR / 2} y={p.bottom - BEAR} width={BEAR} height={BEAR} />
      {place.furniture === 'box' && (
        <g transform={move}>
          <rect x="64" y="82" width="72" height="55" rx="4" fill="#e2b477" />
          <rect x="64" y="82" width="72" height="7" rx="3" fill="#f0cf9c" />
          {!open && <rect x="94" y="82" width="12" height="22" fill="#f8e7c6" />}
          <rect x="64" y="82" width="72" height="55" rx="4" fill="none" stroke="#c4955a" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

/** Cốc nước đầy / vơi. */
function Glass({ level, size }: { level: 'full' | 'low'; size: string }) {
  const top = level === 'full' ? 20 : 74;
  // Thành cốc thu hẹp dần xuống đáy.
  const lx = (y: number) => 22 + (y - 10) * 0.1;
  return (
    <svg viewBox="0 0 100 100" style={{ width: size }} aria-hidden>
      <path d="M22 10 L30 92 H70 L78 10 Z" fill="#f3fbff" />
      <path d={`M${lx(top)} ${top} L${lx(90)} 90 H${100 - lx(90)} L${100 - lx(top)} ${top} Z`} fill="#58b8f0" />
      <path d={`M${lx(top) + 2} ${top} H${98 - lx(top)}`} stroke="#c6eafc" strokeWidth="4" strokeLinecap="round" />
      <path d="M22 10 L30 92 H70 L78 10" fill="none" stroke="#8aa3b8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Cây cao / thấp (cùng khung, cùng mặt đất để thấy rõ chiều cao). */
function Tree({ height, size }: { height: 'tall' | 'short'; size: string }) {
  const top = height === 'tall' ? 4 : 58;
  return (
    <svg viewBox="0 0 100 100" style={{ width: size }} aria-hidden>
      <rect x="10" y="91" width="80" height="7" rx="3.5" fill="#a8da72" />
      <rect x="44" y={top + 18} width="12" height={75 - top} rx="4" fill="#a8693f" />
      <ellipse cx="50" cy={top + 18} rx="23" ry="17" fill="#4db463" />
      <ellipse cx="42" cy={top + 12} rx="9" ry="6" fill="#86d596" />
    </svg>
  );
}

/** Hình của một từ trong trò Trái ngược. */
export function OppositePicture({ art, size }: { art: OppositeArt; size: string }) {
  if ('glass' in art) return <Glass level={art.glass} size={size} />;
  if ('tree' in art) return <Tree height={art.tree} size={size} />;
  return <Emoji glyph={art.emoji} size={`calc(${size} * ${art.scale ?? 1})`} />;
}
