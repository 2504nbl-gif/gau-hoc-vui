// Bộ sưu tập tranh của bé, lưu trong IndexedDB của trình duyệt (chỉ trên máy này).
export interface GalleryItem {
  id?: number;
  kind: 'coloring' | 'drawing';
  /** Tranh tô màu: trang nào và các vùng đã tô màu gì. */
  pageId?: string;
  fills?: Record<string, string>;
  /** Tranh vẽ tự do: ảnh PNG (data URL). */
  png?: string;
  at: number;
}

const DB = 'gau-gallery';
const STORE = 'items';

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((res, rej) => {
    const r = fn(db.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export const saveArt = (item: Omit<GalleryItem, 'id' | 'at'>) => tx('readwrite', (s) => s.add({ ...item, at: Date.now() }));
export const listArt = async () => ((await tx<GalleryItem[]>('readonly', (s) => s.getAll())) ?? []).sort((a, b) => b.at - a.at);
export const deleteArt = (id: number) => tx('readwrite', (s) => s.delete(id));
