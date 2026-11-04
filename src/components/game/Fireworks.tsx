import { useEffect, useRef } from 'react';

// Pháo hoa nhẹ khi bé làm đúng. Nổ ngay chỗ ngón tay vừa chạm/thả (kéo thả cũng vậy),
// nên mọi trò dùng feedbackCorrect đều tự có, không phải sửa từng trò.
const COLORS = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff', '#ff9f45'];
let last = { x: innerWidth / 2, y: innerHeight / 2 };
let fire: ((x: number, y: number) => void) | null = null;

addEventListener('pointerup', (e) => { last = { x: e.clientX, y: e.clientY }; }, { capture: true, passive: true });

/** Bắn pháo hoa tại chỗ chạm gần nhất. */
export const burst = () => fire?.(last.x, last.y);
/** Đổi chỗ nổ cho lần burst tới (vd. kéo thả đúng: nổ giữa vùng thả thay vì chỗ ngón tay). */
export const aimAt = (x: number, y: number) => { last = { x, y }; };

/** Hạt tròn hoặc ngôi sao 5 cánh (star) xoay dần theo spin. */
interface P { x: number; y: number; vx: number; vy: number; life: number; c: string; r: number; star: boolean; spin: number }

function drawStar(ctx: CanvasRenderingContext2D, p: P) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = p.spin - Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? p.r / 2.2 : p.r;
    ctx.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

export function Fireworks() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    const parts: P[] = [];
    let raf = 0;
    const fit = () => { const d = devicePixelRatio || 1; cv.width = innerWidth * d; cv.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    fit();
    addEventListener('resize', fit);
    const tick = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.98; p.life -= 0.018; p.spin += 0.15;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.c;
        if (p.star) drawStar(ctx, p);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      raf = parts.length ? requestAnimationFrame(tick) : 0;
    };
    fire = (x, y) => {
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2, v = 3 + Math.random() * 4;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1, c: COLORS[i % COLORS.length], star: i % 3 === 0, spin: Math.random() * 6,
          r: i % 3 === 0 ? 7 + Math.random() * 5 : 3 + Math.random() * 3 });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    return () => { fire = null; cancelAnimationFrame(raf); removeEventListener('resize', fit); };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-50 h-full w-full" />;
}
