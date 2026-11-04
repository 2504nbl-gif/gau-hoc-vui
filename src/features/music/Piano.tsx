import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { TopBar } from '@/components/ui/TopBar';
import { PressButton } from '@/components/ui/PressButton';
import { sfx } from '@/services/audio/sfx';
import { feedbackDone } from '@/services/audio/feedback';
import { useProgressStore } from '@/store/useProgressStore';
import type { NoteName } from '@/types/curriculum';
import type { GameProps } from '@/features/registry';
import { PianoKeys } from './PianoKeys';

// Giai điệu dân gian / cổ (không còn bản quyền), chỉ dùng nốt, không lời.
const SONGS: { name: string; notes: NoteName[] }[] = [
  { name: 'Ngôi sao nhỏ', notes: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'] },
  { name: 'Chú cừu nhỏ', notes: ['E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4', 'D4', 'D4', 'D4', 'E4', 'G4', 'G4'] },
  { name: 'Kìa con bướm vàng', notes: ['C4', 'D4', 'E4', 'C4', 'C4', 'D4', 'E4', 'C4', 'E4', 'F4', 'G4', 'E4', 'F4', 'G4'] },
];

/** Đàn 8 phím chơi tự do, hoặc chọn bài rồi bấm theo phím đang sáng. */
export function Piano({ onExit }: GameProps) {
  const { childName, addStars } = useProgressStore();
  const [song, setSong] = useState<number | null>(null);
  const [pos, setPos] = useState(0);
  const [down, setDown] = useState<NoteName | null>(null);
  const timers = useRef<number[]>([]);
  const stopDemo = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => stopDemo, []);

  const hit = (n: NoteName) => {
    sfx.note(n);
    setDown(n);
    setTimeout(() => setDown((d) => (d === n ? null : d)), 160);
  };

  const press = (n: NoteName) => {
    hit(n);
    if (song === null) return;
    const notes = SONGS[song].notes;
    if (n !== notes[pos]) return;
    if (pos + 1 >= notes.length) { setSong(null); setPos(0); addStars(1); feedbackDone(childName); return; }
    setPos(pos + 1);
  };

  const demo = () => {
    if (song === null) return;
    stopDemo();
    SONGS[song].notes.forEach((n, i) => timers.current.push(window.setTimeout(() => hit(n), i * 450)));
  };

  return (
    <main className="room" style={{ '--c': 'var(--color-sky)' } as CSSProperties}>
      <TopBar title="Đàn piano" onBack={() => { stopDemo(); onExit(); }} />
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SONGS.map((s, i) => (
          <PressButton key={s.name} color={song === i ? 'grape' : 'sky'} onClick={() => { stopDemo(); setSong(i); setPos(0); }}>🎵 {s.name}</PressButton>
        ))}
        {song !== null && <>
          <PressButton variant="ghost" onClick={demo}>▶ Nghe mẫu</PressButton>
          <PressButton variant="ghost" onClick={() => { stopDemo(); setSong(null); }}>Chơi tự do</PressButton>
        </>}
      </div>
      <p className="m-0 text-center font-bold text-soft">
        {song === null ? 'Bé bấm phím để chơi nhạc tự do.' : `Bấm phím đang sáng nhé! (${pos}/${SONGS[song].notes.length})`}
      </p>
      <PianoKeys onPress={press} down={down} glow={song !== null ? SONGS[song].notes[pos] : null} />
    </main>
  );
}
