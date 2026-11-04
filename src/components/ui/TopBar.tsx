import type { ReactNode } from 'react';
import { useProgressStore } from '@/store/useProgressStore';
import { sfx } from '@/services/audio/sfx';

export function StarChip() {
  const stars = useProgressStore((s) => s.stars);
  return (
    <span className="inline-flex h-11 items-center gap-1.5 rounded-full bg-paper px-4 font-extrabold tabular-nums shadow-[0_3px_0_var(--color-line)]">
      ⭐ {stars}
    </span>
  );
}

/** Thanh trên của mỗi màn hình con: nút quay lại, tên màn hình, phần bên phải. Màu lấy từ --c. */
export function TopBar({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center gap-3">
      <button
        aria-label="Quay lại"
        onClick={() => { sfx.tap(); onBack(); }}
        className="press grid size-12 place-items-center rounded-2xl text-3xl font-extrabold leading-none"
      >
        ‹
      </button>
      <h1 className="title-c m-0 font-display text-[clamp(22px,3.4vw,32px)] font-extrabold">{title}</h1>
      <div className="flex-1" />
      {right}
      <StarChip />
    </header>
  );
}
