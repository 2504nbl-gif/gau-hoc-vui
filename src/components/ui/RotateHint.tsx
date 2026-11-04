import { useEffect, useState } from 'react';
import { Emoji } from '@/components/content/Emoji';

const query = '(orientation: portrait) and (max-width: 1024px)';

/**
 * App thiết kế cho màn hình ngang. Trình duyệt không cho web khóa xoay màn hình,
 * nên khi máy đang dọc thì nhắc xoay ngang. Bố mẹ có thể bỏ qua.
 */
export function RotateHint() {
  const [portrait, setPortrait] = useState(() => window.matchMedia?.(query).matches ?? false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const fn = () => setPortrait(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  if (!portrait || dismissed) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-air p-6 text-center">
      <div className="text-7xl [animation:tilt_2.4s_ease-in-out_infinite_alternate]" aria-hidden><Emoji glyph="📱" /></div>
      <p className="m-0 max-w-[22ch] font-display text-3xl font-extrabold text-ink">Xoay ngang máy để học nhé!</p>
      <button onClick={() => setDismissed(true)} className="press-ghost h-11 rounded-2xl px-5 font-bold text-soft">
        Bố mẹ: dùng màn hình dọc
      </button>
    </div>
  );
}
