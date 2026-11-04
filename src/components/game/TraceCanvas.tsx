import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Tô theo nét: hiện nét chấm + mũi tên chỉ chiều viết, bé dùng ngón tay tô lên.
 * Mỗi nét được coi là xong khi bé phủ ≥ 80% các điểm của nét. Dùng chung cho
 * tô hình (Mỹ thuật) và tập viết số (Toán).
 * Toạ độ nét: SVG path trong hộp 100×100.
 */
export function TraceCanvas({ strokes, color = '#e0547b', onDone, size = 'min(62vh, 46vw)' }: {
  strokes: string[];
  color?: string;
  onDone: () => void;
  size?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  // Lấy mẫu điểm dọc mỗi nét (2 đơn vị một điểm).
  const samples = useMemo(() => strokes.map((d) => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    const len = p.getTotalLength();
    return Array.from({ length: Math.max(2, Math.ceil(len / 2)) }, (_, i) => {
      const pt = p.getPointAtLength((i / Math.max(1, Math.ceil(len / 2) - 1)) * len);
      return [pt.x, pt.y] as [number, number];
    });
  }), [strokes]);
  const covered = useRef<boolean[][]>([]);
  const [doneStrokes, setDoneStrokes] = useState<boolean[]>([]);
  const finished = useRef(false);

  useEffect(() => {
    covered.current = samples.map((s) => s.map(() => false));
    setDoneStrokes(samples.map(() => false));
    finished.current = false;
    const c = canvas.current, b = box.current;
    if (!c || !b) return;
    const r = b.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = r.width * dpr;
    c.height = r.height * dpr;
  }, [samples]);

  const last = useRef<[number, number] | null>(null);
  const toBox = (e: React.PointerEvent): [number, number] => {
    const r = box.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100];
  };

  const paint = (a: [number, number], b: [number, number]) => {
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    const k = c.width / 100;
    ctx.strokeStyle = color;
    ctx.lineWidth = 7 * k;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a[0] * k, a[1] * k);
    ctx.lineTo(b[0] * k, b[1] * k);
    ctx.stroke();
  };

  const mark = (p: [number, number]) => {
    const TOL = 7.5;
    let changed = false;
    const next = [...doneStrokes];
    samples.forEach((pts, s) => {
      if (next[s]) return;
      pts.forEach(([x, y], i) => {
        if (!covered.current[s][i] && Math.hypot(x - p[0], y - p[1]) < TOL) covered.current[s][i] = true;
      });
      const ratio = covered.current[s].filter(Boolean).length / pts.length;
      if (ratio >= 0.8) { next[s] = true; changed = true; }
    });
    if (changed) {
      setDoneStrokes(next);
      if (next.every(Boolean) && !finished.current) { finished.current = true; onDone(); }
    }
  };

  const arrowFor = (pts: [number, number][]) => {
    const [x0, y0] = pts[0];
    const [x1, y1] = pts[Math.min(pts.length - 1, 4)];
    return { x: x0, y: y0, a: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI };
  };

  return (
    <div
      ref={box}
      className="relative aspect-square touch-none rounded-[28px] bg-paper shadow-[0_6px_0_var(--color-line)]"
      style={{ width: size, maxWidth: '100%' }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); last.current = toBox(e); mark(last.current); }}
      onPointerMove={(e) => {
        if (!last.current) return;
        const p = toBox(e);
        paint(last.current, p);
        mark(p);
        last.current = p;
      }}
      onPointerUp={() => { last.current = null; }}
      onPointerCancel={() => { last.current = null; }}
    >
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full">
        {strokes.map((d, i) => (
          <path key={i} d={d} fill="none" strokeLinecap="round" strokeLinejoin="round"
            stroke={doneStrokes[i] ? '#4db463' : '#c5cfdb'} strokeWidth={doneStrokes[i] ? 7 : 3.2} strokeDasharray={doneStrokes[i] ? undefined : '1 5'} />
        ))}
        {samples.map((pts, i) => {
          if (doneStrokes[i]) return null;
          const a = arrowFor(pts);
          return (
            <g key={i} transform={`translate(${a.x} ${a.y})`}>
              <circle r="4.5" fill="#f2b23a">
                <animate attributeName="r" values="3.5;5.5;3.5" dur="1.2s" repeatCount="indefinite" />
              </circle>
              <text y="1.8" textAnchor="middle" fontSize="5" fontWeight="800" fill="#fff" fontFamily="Nunito,sans-serif">{i + 1}</text>
              <g transform={`rotate(${a.a}) translate(9 0)`}>
                <path d="M-3 -3.2 L3 0 L-3 3.2 Z" fill="#f2b23a" />
              </g>
            </g>
          );
        })}
      </svg>
      <canvas ref={canvas} className="pointer-events-none absolute inset-0 size-full opacity-80" />
    </div>
  );
}
