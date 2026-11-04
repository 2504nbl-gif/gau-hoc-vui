import type { ButtonHTMLAttributes, CSSProperties } from 'react';

type Color = 'coral' | 'leaf' | 'sea' | 'sun' | 'teal' | 'grape' | 'berry' | 'sky' | 'peach';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: Color;
  variant?: 'solid' | 'ghost';
  size?: 'md' | 'lg';
}

/** Nút to, bo tròn, nổi 3D — dùng chung cho mọi màn hình. */
export function PressButton({ color = 'coral', variant = 'solid', size = 'md', className = '', style, ...rest }: Props) {
  const sizing = size === 'lg' ? 'h-16 px-8 text-2xl rounded-3xl' : 'h-12 px-5 text-lg rounded-2xl';
  return (
    <button
      {...rest}
      style={{ '--c': `var(--color-${color})`, ...style } as CSSProperties}
      className={`${variant === 'solid' ? 'press' : 'press-ghost'} ${sizing} inline-flex items-center justify-center gap-2 font-display font-extrabold disabled:opacity-40 disabled:pointer-events-none ${className}`}
    />
  );
}
