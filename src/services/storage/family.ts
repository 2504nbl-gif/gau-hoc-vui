// Ảnh gia đình của bé — RIÊNG TƯ: chỉ nằm trong IndexedDB của máy này,
// không bao giờ đi vào mã nguồn, thư mục public/ hay bản build.
// Phụ huynh nạp "gói ảnh" (.json) hoặc thêm từng ảnh trong màn Ảnh gia đình.

export interface FamilyPhoto {
  id: string;
  label: string;
  /** Câu đọc khác nhãn (bỏ trống = đọc nhãn). */
  speak?: string;
  blob: Blob;
  at: number;
}

/**
 * Định dạng gói ảnh gia đình (.json):
 * { "type": "gau-family-pack", "version": 1,
 *   "items": [{ "label": "Bố", "speak"?: "...", "image": "data:image/webp;base64,..." }] }
 */
export interface FamilyPack {
  type: 'gau-family-pack';
  version: 1;
  items: { label: string; speak?: string; image: string }[];
}

const DB = 'gau-family';
const STORE = 'photos';
export const PHOTO_SIZE = 512;

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => res(r ? r.result : undefined);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  });
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const listPhotos = async () =>
  ((await run<FamilyPhoto[]>('readonly', (s) => s.getAll())) ?? []).sort((a, b) => a.at - b.at);

export const addPhoto = (p: { label: string; speak?: string; blob: Blob }) =>
  run('readwrite', (s) => s.put({ ...p, id: newId(), at: Date.now() } satisfies FamilyPhoto));

export const deletePhoto = (id: string) => run('readwrite', (s) => s.delete(id));

/** Nạp gói ảnh: thay toàn bộ ảnh cũ bằng ảnh trong gói. Trả về số ảnh đã nạp. */
export async function importPack(file: File): Promise<number> {
  let pack: FamilyPack;
  try { pack = JSON.parse(await file.text()); } catch { throw new Error('File không phải gói ảnh (.json) hợp lệ'); }
  if (pack?.type !== 'gau-family-pack' || !Array.isArray(pack.items)) throw new Error('File không phải gói ảnh gia đình của Gấu');
  const items = await Promise.all(
    pack.items
      .filter((it) => it && typeof it.label === 'string' && it.label.trim() && typeof it.image === 'string' && it.image.startsWith('data:image/'))
      .map(async (it) => ({ label: it.label.trim(), speak: it.speak?.trim() || undefined, blob: await (await fetch(it.image)).blob() })),
  );
  if (!items.length) throw new Error('Gói ảnh không có ảnh nào');
  const base = Date.now();
  await run('readwrite', (s) => {
    s.clear();
    items.forEach((it, i) => s.put({ ...it, id: newId(), at: base + i } satisfies FamilyPhoto));
  });
  return items.length;
}

/** Nạp ảnh từ file thành <img> (để cắt). Dùng xong thì URL.revokeObjectURL(img.src). */
export function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Không đọc được ảnh')); };
    img.src = url;
  });
}

/**
 * Cắt vuông rồi thu về 512px webp.
 * `zoom` ≥ 1 (1 = cạnh ngắn vừa khung), `cx`/`cy` là tâm khung cắt theo tỉ lệ 0–1 của ảnh.
 */
export function cropSquare(img: HTMLImageElement, zoom = 1, cx = 0.5, cy = 0.5): Promise<Blob> {
  const w = img.naturalWidth, h = img.naturalHeight;
  const side = Math.min(w, h) / Math.max(1, zoom);
  const x = Math.min(w - side, Math.max(0, cx * w - side / 2));
  const y = Math.min(h - side, Math.max(0, cy * h - side / 2));
  const c = document.createElement('canvas');
  c.width = c.height = PHOTO_SIZE;
  const g = c.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, x, y, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Không cắt được ảnh'))), 'image/webp', 0.85));
}
