/** Chấm tiến độ các lượt chơi. */
export function RoundDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Lượt ${Math.min(current + 1, total)} trên ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`size-3.5 rounded-full border-2 transition-all ${
            i < current ? 'border-[var(--c)] bg-[var(--c)]' : i === current ? 'scale-125 border-[var(--c)] bg-paper' : 'border-line bg-paper'
          }`}
        />
      ))}
    </div>
  );
}
