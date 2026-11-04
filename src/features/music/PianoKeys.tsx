import type { NoteName } from '@/types/curriculum';
import { NOTE_LABEL } from '@/services/audio/sfx';

export const NOTES: NoteName[] = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
export const NOTE_COLOR: Record<NoteName, string> = {
  C4: '#ee5a4f', D4: '#f2903a', E4: '#f2c53a', F4: '#4db463', G4: '#2bb0a3', A4: '#4b9cef', B4: '#8d71e8', C5: '#e0547b',
};

/** Dãy phím đàn 8 nốt Đô → Đố. Dùng chung cho Đàn piano và Kéo nốt nhạc. */
export function PianoKeys({ onPress, glow, down, drop }: {
  onPress?: (n: NoteName) => void;
  glow?: NoteName | null;
  down?: NoteName | null;
  /** Bật để mỗi phím là một vùng thả (data-drop = tên nốt). */
  drop?: boolean;
}) {
  return (
    <div className="flex min-h-[160px] w-full flex-1 gap-1.5">
      {NOTES.map((n) => (
        <button
          key={n}
          data-drop={drop ? n : undefined}
          onPointerDown={(e) => { if (onPress) { e.preventDefault(); onPress(n); } }}
          className={`flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5 rounded-b-[20px] pb-3 font-display text-[clamp(14px,2.4vw,22px)] font-extrabold transition-transform ${
            down === n ? 'translate-y-1' : ''
          }`}
          style={{
            background: down === n ? `color-mix(in srgb, ${NOTE_COLOR[n]} 30%, white)` : '#fff',
            boxShadow: `inset 0 -12px 0 ${NOTE_COLOR[n]}, 0 4px 0 var(--color-line)`,
            animation: glow === n ? 'keyglow .8s ease-in-out infinite' : undefined,
            ['--k' as string]: NOTE_COLOR[n],
          }}
        >
          <span className="size-[clamp(20px,3.6vw,34px)] rounded-full" style={{ background: NOTE_COLOR[n] }} />
          {NOTE_LABEL[n]}
        </button>
      ))}
      <style>{'@keyframes keyglow{50%{background:color-mix(in srgb,var(--k) 45%,white)}}'}</style>
    </div>
  );
}
