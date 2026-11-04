import { useEffect } from 'react';
import { GAME_META } from '@/data/gameList';
import { useNav } from '@/store/useNav';
import { dayKey, useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { setVoiceVolume } from '@/services/audio/AudioManager';
import { muteMusic, setMusic } from '@/services/audio/music';
import { loadPack } from '@/services/audio/voicePack';
import { Bedtime } from './Bedtime';

const TICK_S = 15;
const MUSIC_MODULE_GAMES = new Set(GAME_META.filter((g) => g.module === 'music').map((g) => g.id));

/**
 * Chạy ngầm suốt phiên: áp cài đặt âm thanh, đếm thời gian chơi trong ngày,
 * tắt nhạc nền ở trò âm nhạc, và hiện màn "Gấu đi ngủ rồi" khi hết giờ.
 */
export function AppSession() {
  const { voiceVolume, musicOn, musicVolume, voice, dailyLimitMin } = useSettingsStore();
  const { route, go } = useNav();
  const addPlayTime = useProgressStore((s) => s.addPlayTime);
  const todaySeconds = useProgressStore((s) => s.daily[dayKey()]?.seconds ?? 0);

  const inParent = route.name === 'parent';
  const bedtime = dailyLimitMin > 0 && todaySeconds >= dailyLimitMin * 60 && !inParent;
  const musicGame = route.name === 'play' && MUSIC_MODULE_GAMES.has(route.game);

  useEffect(() => setVoiceVolume(voiceVolume), [voiceVolume]);
  useEffect(() => setMusic(musicOn, musicVolume), [musicOn, musicVolume]);
  useEffect(() => muteMusic(musicGame || bedtime), [musicGame, bedtime]);
  useEffect(() => { void loadPack(voice); }, [voice]);
  // Hết giờ: đưa về trang chủ để trò đang chơi dừng hẳn, rồi phủ màn đi ngủ lên trên.
  useEffect(() => { if (bedtime) go({ name: 'dashboard' }); }, [bedtime, go]);

  // Chỉ đếm khi bé đang ở trong app (màn hình bật, không ở Góc phụ huynh, chưa tới giờ ngủ).
  useEffect(() => {
    if (inParent || bedtime) return;
    const id = window.setInterval(() => { if (!document.hidden) addPlayTime(TICK_S); }, TICK_S * 1000);
    return () => window.clearInterval(id);
  }, [inParent, bedtime, addPlayTime]);

  return bedtime ? <Bedtime /> : null;
}
