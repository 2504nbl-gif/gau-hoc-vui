// Gói giọng thu sẵn (tạo bởi scripts/build_voice_pack.py).
// manifest.clips[câu] = [nhóm, giây bắt đầu, độ dài, mốc từng chữ?]
//
// Nhiều gói giọng: public/audio/<voiceId>/manifest.json (vd bo, me).
// Tương thích bố cục cũ: gói nằm thẳng ở public/audio/manifest.json được coi là gói 'bo'.
import { useSettingsStore, type VoiceId } from '@/store/useSettingsStore';

export type WordTimes = [number, number][];
type ClipEntry = [sprite: string, offset: number, duration: number, words?: WordTimes];

interface Manifest {
  voice: string;
  generated: string;
  sprites: Record<string, string>;
  clips: Record<string, ClipEntry>;
}

export interface Clip { url: string; offset: number; duration: number; words?: WordTimes }

/** Phải khớp norm() trong scripts/build_voice_pack.py */
export const normKey = (t: string) => t.normalize('NFC').trim().replace(/\s+/g, ' ');

const BASE = import.meta.env.BASE_URL;

/** Nơi tìm manifest của từng gói, theo thứ tự ưu tiên. */
const LOCATIONS: Record<VoiceId, string[]> = {
  bo: ['audio/bo/', 'audio/'],
  me: ['audio/me/'],
  may: [],
};

interface Loaded { manifest: Manifest; dir: string }

const cache = new Map<VoiceId, Promise<Loaded | null>>();

/** Đọc manifest của một gói (nhớ lại). Không có gói → null. */
function fetchPack(id: VoiceId): Promise<Loaded | null> {
  let p = cache.get(id);
  if (!p) {
    p = (async () => {
      for (const dir of LOCATIONS[id]) {
        // Máy chủ dev/PWA có thể trả index.html cho file thiếu → r.json() lỗi → coi như không có.
        const m = await fetch(`${BASE}${dir}manifest.json`)
          .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : null))
          .catch(() => null);
        if (m?.clips) return { manifest: m, dir };
      }
      return null;
    })();
    cache.set(id, p);
  }
  return p;
}

/** Gói có tồn tại không (để làm mờ ô chọn "Mẹ" khi chưa ghi âm). */
export const packAvailable = (id: VoiceId) => (id === 'may' ? Promise.resolve(true) : fetchPack(id).then(Boolean));

let active: Loaded | null = null;
let activeId: VoiceId | null = null;

/** Promise của gói đang chọn; `true` = có gói. Biến được đổi khi chọn giọng khác (live binding). */
export let packReady: Promise<boolean> = Promise.resolve(false);

/** Chọn gói giọng. Gói chưa có thì rơi về giọng máy. */
export function loadPack(id: VoiceId): Promise<boolean> {
  if (id === activeId) return packReady;
  activeId = id;
  packReady = fetchPack(id).then((l) => {
    if (activeId === id) active = l;
    return Boolean(l);
  });
  return packReady;
}

/** Đường dẫn file nhóm: manifest cũ ghi "audio/x.mp3" (tính từ gốc web); tên trần thì tính từ thư mục gói. */
const spriteUrl = (l: Loaded, sprite: string) => BASE + (sprite.includes('/') ? sprite : l.dir + sprite);

export function findClip(text: string): Clip | null {
  if (!active) return null;
  const e = active.manifest.clips[normKey(text)];
  if (!e) return null;
  return { url: spriteUrl(active, active.manifest.sprites[e[0]]), offset: e[1], duration: e[2], words: e[3] };
}

export const packInfo = () => (active ? { voice: active.manifest.voice, clips: Object.keys(active.manifest.clips).length } : null);

// Nạp ngay gói đã chọn khi mở app; đổi giọng trong Góc phụ huynh sẽ gọi lại loadPack().
void loadPack(useSettingsStore.getState().voice);
