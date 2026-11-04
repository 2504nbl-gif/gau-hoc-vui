import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { TopBar } from '@/components/ui/TopBar';
import { PressButton } from '@/components/ui/PressButton';
import { PALETTE } from '@/data/art';
import { PHRASES } from '@/data/phrases';
import { saveArt } from '@/services/storage/gallery';
import { preloadVoice, say } from '@/services/audio/voice';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

/** Không gian sáng tạo: bảng vẽ tự do với bút to/nhỏ, tẩy, lưu vào Bộ sưu tập. */
export function FreeDraw({ onExit }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(PALETTE[4]);
  const [size, setSize] = useState(10);
  const [erase, setErase] = useState(false);
  const [note, setNote] = useState('');
  const last = useRef<[number, number] | null>(null);

  const clear = () => {
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
  };

  useEffect(() => {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    c.width = Math.round(r.width);
    c.height = Math.round(r.height);
    clear();
    preloadVoice([PHRASES.drawHint, PHRASES.saved], 'vi').then(() => say(PHRASES.drawHint));
  }, []);

  const pt = (e: React.PointerEvent): [number, number] => {
    const r = canvas.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * canvas.current!.width, ((e.clientY - r.top) / r.height) * canvas.current!.height];
  };
  const line = (a: [number, number], b: [number, number]) => {
    const ctx = canvas.current!.getContext('2d')!;
    ctx.strokeStyle = erase ? '#fff' : color;
    ctx.lineWidth = erase ? size * 2.5 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.stroke();
  };

  const save = async () => {
    try {
      await saveArt({ kind: 'drawing', png: canvas.current!.toDataURL('image/png') });
      setNote('Đã lưu vào Bộ sưu tập'); say(PHRASES.saved); sfx.success();
    } catch { setNote('Máy này chưa lưu được tranh'); }
  };

  return (
    <main className="room" style={{ '--c': 'var(--color-berry)' } as CSSProperties}>
      <TopBar title="Vẽ tự do" onBack={onExit}
        right={<>
          <PressButton variant="ghost" onClick={clear}>🧽 Xóa</PressButton>
          <PressButton color="leaf" onClick={save}>💾 Lưu</PressButton>
        </>} />
      <canvas ref={canvas} className="min-h-0 w-full flex-1 touch-none rounded-[26px] bg-paper shadow-[0_5px_0_var(--color-line)]"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); last.current = pt(e); line(last.current, last.current); setNote(''); }}
        onPointerMove={(e) => { if (!last.current) return; const p = pt(e); line(last.current, p); last.current = p; }}
        onPointerUp={() => { last.current = null; }} onPointerCancel={() => { last.current = null; }} />
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PALETTE.map((c) => (
          <button key={c} aria-label="Chọn màu" onClick={() => { sfx.tap(); setColor(c); setErase(false); }}
            className={`size-10 rounded-full border-4 border-white ${color === c && !erase ? 'ring-4 ring-ink' : 'ring-2 ring-line'}`} style={{ background: c }} />
        ))}
        {[6, 14, 26].map((w) => (
          <button key={w} aria-label={`Bút cỡ ${w}`} onClick={() => setSize(w)}
            className={`grid size-11 place-items-center rounded-xl bg-paper ${size === w ? 'ring-4 ring-berry' : 'ring-2 ring-line'}`}>
            <span className="rounded-full bg-ink" style={{ width: w / 1.4 + 4, height: w / 1.4 + 4 }} />
          </button>
        ))}
        <button onClick={() => setErase((x) => !x)} className={`h-11 rounded-xl px-3 font-extrabold ${erase ? 'bg-berry text-white' : 'bg-paper ring-2 ring-line'}`}>Tẩy</button>
      </div>
      {note && <p className="m-0 text-center font-extrabold text-leaf">{note}</p>}
    </main>
  );
}
