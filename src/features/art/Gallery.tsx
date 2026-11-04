import { useEffect, useState, type CSSProperties } from 'react';
import { TopBar } from '@/components/ui/TopBar';
import { Modal } from '@/components/ui/Modal';
import { PressButton } from '@/components/ui/PressButton';
import { deleteArt, listArt, type GalleryItem } from '@/services/storage/gallery';
import { ColoringSvg } from './Coloring';
import type { GameProps } from '@/features/registry';

const Art = ({ item, className }: { item: GalleryItem; className: string }) =>
  item.kind === 'coloring' && item.pageId
    ? <ColoringSvg pageId={item.pageId} fills={item.fills ?? {}} className={className} />
    : <img src={item.png} alt="Tranh của bé" className={`${className} object-contain`} draggable={false} />;

/** Bộ sưu tập: các tranh bé đã tô, đã vẽ (lưu trên máy này). */
export function Gallery({ onExit }: GameProps) {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [view, setView] = useState<GalleryItem | null>(null);
  const [confirm, setConfirm] = useState(false);
  const load = () => listArt().then(setItems).catch(() => setItems([]));
  useEffect(() => { void load(); }, []);

  return (
    <main className="room" style={{ '--c': 'var(--color-berry)' } as CSSProperties}>
      <TopBar title="Bộ sưu tập" onBack={onExit} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {items && items.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <p className="m-0 max-w-[30ch] font-display text-2xl font-extrabold text-soft">Chưa có tranh nào. Bé vào Tô màu hoặc Vẽ tự do rồi bấm 💾 Lưu nhé!</p>
          </div>
        )}
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 p-0">
          {items?.map((it) => (
            <li key={it.id}>
              <button onClick={() => { setView(it); setConfirm(false); }} className="block w-full overflow-hidden rounded-[22px] bg-paper p-2 shadow-[0_5px_0_var(--color-line)]">
                <Art item={it} className="aspect-square w-full rounded-xl" />
                <span className="mt-1 block text-xs font-bold text-soft tabular-nums">{new Date(it.at).toLocaleDateString('vi-VN')}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <Modal open={!!view} onClose={() => setView(null)} width="min(560px, 100%)">
        {view && (
          <div className="flex flex-col items-center gap-3">
            <Art item={view} className="aspect-square w-full max-w-[420px] rounded-2xl" />
            <div className="flex flex-wrap justify-center gap-3">
              <PressButton variant="ghost" onClick={() => setView(null)}>Đóng</PressButton>
              <PressButton color="berry" onClick={async () => {
                if (!confirm) { setConfirm(true); return; }
                await deleteArt(view.id!); setView(null); void load();
              }}>{confirm ? 'Bấm lần nữa để xóa' : '🗑 Xóa tranh'}</PressButton>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
