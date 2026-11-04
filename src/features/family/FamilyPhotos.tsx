import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { TopBar } from '@/components/ui/TopBar';
import { PressButton } from '@/components/ui/PressButton';
import { Modal } from '@/components/ui/Modal';
import { useNav } from '@/store/useNav';
import { useFamilyStore } from '@/store/useFamilyStore';
import { addPhoto, cropSquare, deletePhoto, importPack, loadImage } from '@/services/storage/family';
import { say } from '@/services/audio/voice';
import { sfx } from '@/services/audio/sfx';
import { PHRASES } from '@/data/phrases';

/** Nhãn gợi ý. Bố, Mẹ, Ông, Bà, Em bé, Anh trai đã có giọng đọc thu sẵn. */
const SUGGEST = ['Bố', 'Mẹ', 'Ông', 'Bà', 'Gấu Anh', 'Gấu Em', 'Cả nhà'];

/** Màn người lớn: quản lý ảnh gia đình (chỉ lưu trên máy này). */
export function FamilyPhotos() {
  const go = useNav((s) => s.go);
  const { photos, load } = useFamilyStore();
  const packInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<HTMLImageElement | null>(null);
  const style = { '--c': 'var(--color-grape)' } as CSSProperties;

  const onPack = async (file?: File) => {
    if (!file) return;
    if (photos.length && !window.confirm(`Nạp gói ảnh sẽ thay ${photos.length} ảnh đang có. Tiếp tục?`)) return;
    try {
      const n = await importPack(file);
      await load();
      sfx.select();
      setMsg(`Đã nạp ${n} ảnh. Chủ đề "${PHRASES.familyTopic}" đã có trong Tráo thẻ.`);
    } catch (e) {
      sfx.wrong();
      setMsg((e as Error).message);
    }
  };

  const onPhoto = async (file?: File) => {
    if (!file) return;
    try { setEditing(await loadImage(file)); } catch (e) { setMsg((e as Error).message); }
  };
  const closeEditor = () => { if (editing) URL.revokeObjectURL(editing.src); setEditing(null); };

  const onDelete = async (id: string, label: string) => {
    if (!window.confirm(`Xóa ảnh "${label}"?`)) return;
    await deletePhoto(id);
    await load();
  };

  return (
    <main className="room" style={style}>
      <TopBar title="Ảnh gia đình" onBack={() => go({ name: 'parent' })} />
      <p className="m-0 font-bold text-soft">
        🔒 Ảnh chỉ lưu trong máy này, không tải lên mạng. Có từ 1 ảnh trở lên thì chủ đề “{PHRASES.familyTopic}” hiện trong Tráo thẻ
        (từ 3 ảnh thì có thêm ở Nhận biết, Nghe và tìm).
      </p>

      <div className="flex flex-wrap gap-3">
        <PressButton color="grape" onClick={() => packInput.current?.click()}>📦 Nạp gói ảnh (.json)</PressButton>
        <PressButton color="leaf" onClick={() => photoInput.current?.click()}>➕ Thêm một ảnh</PressButton>
        <input ref={packInput} type="file" accept=".json,application/json" hidden
          onChange={(e) => { void onPack(e.target.files?.[0]); e.target.value = ''; }} />
        <input ref={photoInput} type="file" accept="image/*" hidden
          onChange={(e) => { void onPhoto(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      {msg && <p role="status" className="m-0 rounded-2xl bg-paper px-4 py-2 font-extrabold">{msg}</p>}

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        {photos.length === 0 ? (
          <p className="mt-6 text-center text-lg font-extrabold text-soft">Chưa có ảnh nào.</p>
        ) : (
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 p-0">
            {photos.map((p) => (
              <li key={p.id} className="relative rounded-[24px] bg-paper p-2.5 shadow-[0_5px_0_var(--color-line)]">
                <button className="block w-full" onClick={() => say(p.speak ?? p.label)}>
                  <img src={p.url} alt={p.label} className="block aspect-square w-full rounded-2xl object-cover" draggable={false} />
                  <b className="mt-1.5 block truncate text-center font-display text-lg">{p.label}</b>
                </button>
                <button aria-label={`Xóa ${p.label}`} onClick={() => void onDelete(p.id, p.label)}
                  className="absolute top-1 right-1 grid size-10 place-items-center rounded-full bg-paper text-lg shadow">
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={!!editing} onClose={closeEditor} width="min(720px, 100%)">
        {editing && <CropEditor img={editing} onDone={async (saved) => { closeEditor(); if (saved) { await load(); setMsg(`Đã thêm ảnh "${saved}".`); } }} />}
      </Modal>
    </main>
  );
}

const BOX = 280;

/** Cắt vuông đơn giản: kéo để dời, thanh trượt để phóng to; gõ nhãn rồi lưu. */
function CropEditor({ img, onDone }: { img: HTMLImageElement; onDone: (savedLabel: string | null) => void }) {
  const w = img.naturalWidth, h = img.naturalHeight;
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 });
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const side = Math.min(w, h) / zoom;          // cạnh khung cắt, theo pixel ảnh
  const scale = BOX / side;                    // pixel ảnh → pixel màn hình
  const clamp = (v: number, len: number) => Math.min(1 - side / 2 / len, Math.max(side / 2 / len, v));
  const cx = clamp(center.x, w), cy = clamp(center.y, h);

  const onDown = (e: PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: cx, y: cy };
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setCenter({ x: clamp(d.x - (e.clientX - d.px) / scale / w, w), y: clamp(d.y - (e.clientY - d.py) / scale / h, h) });
  };

  const save = async () => {
    const name = label.trim();
    if (!name) return;
    setBusy(true);
    try {
      await addPhoto({ label: name, blob: await cropSquare(img, zoom, cx, cy) });
      sfx.select();
      onDone(name);
    } catch (e) {
      window.alert((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-start justify-center gap-5">
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative cursor-grab overflow-hidden rounded-3xl bg-ink/10 [touch-action:none]"
          style={{ width: BOX, height: BOX }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
        >
          <img
            src={img.src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{ width: w * scale, height: h * scale, left: -(cx * w - side / 2) * scale, top: -(cy * h - side / 2) * scale }}
          />
        </div>
        <label className="flex w-full items-center gap-2 font-extrabold text-soft">
          🔍
          <input type="range" min={1} max={4} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1" />
        </label>
        <span className="text-sm font-bold text-soft">Kéo ảnh để chọn chỗ cắt</span>
      </div>

      <div className="flex min-w-[240px] flex-1 flex-col gap-3">
        <b className="font-display text-xl">Ảnh này là ai?</b>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ví dụ: Bố"
          maxLength={30}
          className="h-12 rounded-2xl border-2 border-line bg-white px-4 text-lg font-extrabold outline-none focus:border-grape"
        />
        <div className="flex flex-wrap gap-2">
          {SUGGEST.map((s) => (
            <button key={s} onClick={() => setLabel(s)}
              className={`rounded-full px-3.5 py-1.5 font-extrabold ${label === s ? 'bg-grape text-white' : 'bg-cloud text-ink'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-3">
          <PressButton variant="ghost" onClick={() => onDone(null)}>Hủy</PressButton>
          <PressButton color="leaf" disabled={!label.trim() || busy} onClick={() => void save()}>💾 Lưu ảnh</PressButton>
        </div>
      </div>
    </div>
  );
}
