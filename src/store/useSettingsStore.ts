import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Gói giọng: 'bo' (giọng bố), 'me' (giọng mẹ), 'may' (giọng của máy, không dùng gói). */
export type VoiceId = 'bo' | 'me' | 'may';

export interface AppSettings {
  /** Âm lượng giọng đọc 0–1. */
  voiceVolume: number;
  musicOn: boolean;
  /** Âm lượng nhạc nền 0–1 (đã được nhân nhỏ lại khi phát). */
  musicVolume: number;
  /** Giới hạn phút chơi mỗi ngày; 0 = không giới hạn. */
  dailyLimitMin: number;
  voice: VoiceId;
}

interface SettingsStore extends AppSettings {
  set: (patch: Partial<AppSettings>) => void;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  voiceVolume: 1,
  musicOn: true,
  musicVolume: 0.35,
  dailyLimitMin: 0,
  voice: 'bo',
};

/** Cài đặt của bố mẹ (Góc phụ huynh). Tên bé vẫn nằm ở useProgressStore.childName. */
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({ ...DEFAULT_APP_SETTINGS, set: (patch) => set(patch) }),
    { name: 'gau-settings', version: 1 },
  ),
);
