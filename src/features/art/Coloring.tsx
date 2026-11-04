import { useEffect, useState, type CSSProperties } from 'react';
import { TopBar } from '@/components/ui/TopBar';
import { PressButton } from '@/components/ui/PressButton';
import { COLORING_PAGES, PALETTE } from '@/data/art';
import { PHRASES } from '@/data/phrases';
import { saveArt } from '@/services/storage/gallery';
import { preloadVoice, say } from '@/services/audio/voice';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

/** Vẽ một trang tô màu với các vùng đã tô (dùng cả ở Bộ sưu tập). */
export function ColoringSvg({ pageId, fills, onRegion, className = '' }: {
  pageId: string; fills: Record<string, string>; onRegion?: (id: string) => void; className?: string;
}) {
  const page = COLORING_PAGES.find((p) => p.id === pageId)!;
  return (
    <svg viewBox="0 0 200 200" className={className}>
      <rect width="200" height="200" fill="#fff" />
      {page.regions.map((r) => (
        <path key={r.id} d={r.d} fill={fills[r.id] ?? '#fff'} stroke="#2b3a4f" strokeWidth="2.6" strokeLinejoin="round"
          onClick={onRegion ? () => onRegion(r.id) : undefined} className={onRegion ? 'cursor-pointer' : ''} />
      ))}
    </svg>
  );
}

/** Tô màu tranh: chọn màu rồi chạm vùng nào là vùng đó đổi màu. Lưu được vào Bộ sưu tập. */
export function Coloring({ onExit }: GameProps) {
  const [pageId, setPageId] = useState<string | null>(null);
  const [fills, setFills] = useState<Record<string, string>>({});
  const [color, setColor] = useState(PALETTE[0]);
  const [note, setNote] = useState('');

  useEffect(() => { preloadVoice([PHRASES.colorHint, PHRASES.saved, ...COLORING_PAGES.map((p) => p.name)], 'vi'); }, []);

  const style = { '--c': 'var(--color-berry)' } as CSSProperties;
  if (!pageId) {
    return (
      <main className="room" style={style}>
        <TopBar title="Tô màu tranh" onBack={onExit} />
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-y-auto sm:grid-cols-4">
          {COLORING_PAGES.map((p) => (
            <button key={p.id} onClick={() => { sfx.select(); setPageId(p.id); setFills({}); say(p.name); setTimeout(() => say(PHRASES.colorHint), 1200); }}
              className="flex flex-col items-center gap-2 rounded-[26px] bg-paper p-3 shadow-[0_5px_0_var(--color-line)]">
              <ColoringSvg pageId={p.id} fills={{}} className="aspect-square w-full" />
              <b className="title-c font-display text-xl">{p.name}</b>
            </button>
          ))}
        </div>
      </main>
    );
  }

  const save = async () => {
    try { await saveArt({ kind: 'coloring', pageId, fills }); setNote('Đã lưu vào Bộ sưu tập'); say(PHRASES.saved); sfx.success(); }
    catch { setNote('Máy này chưa lưu được tranh'); }
  };

  return (
    <main className="room" style={style}>
      <TopBar title={COLORING_PAGES.find((p) => p.id === pageId)!.name} onBack={() => setPageId(null)}
        right={<>
          <PressButton variant="ghost" onClick={() => setFills({})}>↺ Tô lại</PressButton>
          <PressButton color="leaf" onClick={save}>💾 Lưu</PressButton>
        </>} />
      <div className="flex min-h-0 flex-1 items-center justify-center gap-4">
        <ColoringSvg pageId={pageId} fills={fills} className="aspect-square h-full max-h-full max-w-[70vw] rounded-[26px] shadow-[0_5px_0_var(--color-line)]"
          onRegion={(id) => { sfx.pop(); setFills((f) => ({ ...f, [id]: color })); setNote(''); }} />
        <div className="grid grid-cols-2 gap-2">
          {PALETTE.map((c) => (
            <button key={c} aria-label="Chọn màu" onClick={() => { sfx.tap(); setColor(c); }}
              className={`size-[min(9vh,52px)] rounded-full border-4 border-white ${color === c ? 'ring-4 ring-ink' : 'ring-2 ring-line'}`} style={{ background: c }} />
          ))}
        </div>
      </div>
      {note && <p className="m-0 text-center font-extrabold text-leaf">{note}</p>}
    </main>
  );
}
