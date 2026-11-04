import { sfx } from '@/services/audio/sfx';
import { EmojiText } from '@/components/content/Emoji';

interface Option<T> { value: T; label: string }

/** Nhóm nút chọn 1 trong nhiều — dùng cho mọi bảng cài đặt. */
export function Segmented<T extends string | number>({
  value, options, onChange, label,
}: { value: T; options: Option<T>[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={on}
            onClick={() => { sfx.tap(); onChange(o.value); }}
            className={`h-11 rounded-xl border-2 px-4 font-extrabold transition-colors ${
              on ? 'border-sea bg-sea text-white' : 'border-line bg-cloud text-ink'
            }`}
          >
            <EmojiText text={o.label} />
          </button>
        );
      })}
    </div>
  );
}
