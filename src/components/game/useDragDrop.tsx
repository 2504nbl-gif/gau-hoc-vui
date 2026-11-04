import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';
import { sfx } from '@/services/audio/sfx';
import { aimAt } from './Fireworks';

/**
 * Kéo thả bằng Pointer Events cho màn hình cảm ứng, dùng chung cho mọi trò.
 * Vùng thả là phần tử có thuộc tính `data-drop="<id>"` (bỏ thuộc tính đi khi vùng đã xong).
 *
 *   const dnd = useDragDrop<Item>((item, zone) => …, {
 *     accept: (item, zone) => zone === item.id,  // đúng → hình "hít" vào giữa vùng rồi mới gọi onDrop
 *     onTap: (item) => say(item.name),           // chạm mà không kéo
 *   });
 *   <div onPointerDown={(e) => dnd.start(e, item, <Hình/>)} />
 *   <div data-drop="bong-1" className={dnd.over === 'bong-1' ? 'sáng lên' : ''} />
 *   {dnd.ghost}
 *
 * - Chạm và kéo phân biệt bằng ngưỡng 10px, nên bé chạm hơi run tay vẫn là "chạm".
 * - Vùng thả nới rộng 25% cạnh ngắn cho bé 2 tuổi dễ thả trúng; `over` là vùng đang lơ lửng phía trên.
 * - Thả ra ngoài hoặc sai (accept trả false): hình bay lò xo về chỗ cũ, onDrop gọi ngay để phản hồi.
 * - Không truyền accept: thả vào vùng nào thì hình biến mất tại đó (trò tự vẽ kết quả).
 */
interface Options<T> {
  accept?: (payload: T, zone: string) => boolean;
  onTap?: (payload: T) => void;
  /** Độ nới vùng thả, tỉ lệ theo cạnh ngắn của vùng. Mặc định 0.25. */
  pad?: number;
}

type Pt = { x: number; y: number };
const TAP_PX = 10;
const SPRING = { type: 'spring', duration: 0.45, bounce: 0.4 } as const;
const center = (r: DOMRect): Pt => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

/** Vùng thả gần ngón tay nhất trong phạm vi đã nới rộng. */
function zoneAt(x: number, y: number, pad: number): HTMLElement | null {
  let best: HTMLElement | null = null;
  let bestD = Infinity;
  document.querySelectorAll<HTMLElement>('[data-drop]').forEach((el) => {
    const r = el.getBoundingClientRect();
    const d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
    if (d <= pad * Math.min(r.width, r.height) && d <= bestD) { best = el; bestD = d; }
  });
  return best;
}

export function useDragDrop<T>(onDrop: (payload: T, zoneId: string | null) => void, opts: Options<T> = {}) {
  const [drag, setDrag] = useState<{ payload: T; node: ReactNode; lifted: boolean } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const cb = useRef({ onDrop, opts });
  cb.current = { onDrop, opts };
  const busy = useRef(false);
  const unlisten = useRef<() => void>(() => {});
  useEffect(() => () => unlisten.current(), []);

  const start = (e: React.PointerEvent, payload: T, node: ReactNode) => {
    if (busy.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    busy.current = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sự kiện giả lập */ }
    sfx.tap();
    const id = e.pointerId;
    const from: Pt = { x: e.clientX, y: e.clientY };
    const home = center(e.currentTarget.getBoundingClientRect());
    const pad = cb.current.opts.pad ?? 0.25;
    let moved = false;
    let zone: string | null = null;

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      if (!moved) {
        if (Math.hypot(ev.clientX - from.x, ev.clientY - from.y) < TAP_PX) return;
        moved = true;
        setDrag({ payload, node, lifted: true });
      }
      // Giữ nguyên chỗ ngón tay nắm trên hình, không bị giật về tâm.
      x.set(home.x + ev.clientX - from.x);
      y.set(home.y + ev.clientY - from.y);
      const z = zoneAt(ev.clientX, ev.clientY, pad)?.dataset.drop ?? null;
      if (z !== zone) { zone = z; setOver(z); }
    };
    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      unlisten.current();
      setOver(null);
      const { onDrop: drop, opts: o } = cb.current;
      if (!moved) { busy.current = false; if (ev.type === 'pointerup') o.onTap?.(payload); return; }
      const el = ev.type === 'pointerup' ? zoneAt(ev.clientX, ev.clientY, pad) : null;
      const z = el?.dataset.drop ?? null;
      const done = () => { busy.current = false; setDrag(null); };
      const fly = (to: Pt) => Promise.all([animate(x, to.x, SPRING), animate(y, to.y, SPRING)]);
      setDrag((d) => d && { ...d, lifted: false });
      if (el && z && o.accept?.(payload, z)) {
        const c = center(el.getBoundingClientRect());
        aimAt(c.x, c.y); // pháo hoa nổ giữa vùng thả
        fly(c).then(() => { done(); drop(payload, z); });
      } else if (z && !o.accept) {
        done(); drop(payload, z);
      } else {
        fly(home).then(done);
        drop(payload, z);
      }
    };
    unlisten.current = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  const ghost = drag ? (
    <motion.div className="pointer-events-none fixed left-0 top-0 z-50" style={{ x, y }}>
      <div className="-translate-x-1/2 -translate-y-1/2">
        <motion.div initial={{ scale: 1, rotate: 0 }} animate={drag.lifted ? { scale: 1.12, rotate: -4 } : { scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }} className="drop-shadow-xl">
          {drag.node}
        </motion.div>
      </div>
    </motion.div>
  ) : null;

  return { start, ghost, over, dragging: drag?.payload ?? null };
}
