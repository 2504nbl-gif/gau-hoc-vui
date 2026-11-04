import type { ReactNode } from 'react';
import type { SceneDef } from '@/data/games';
import { Emoji } from '@/components/content/Emoji';

/** Nền cảnh (biển, rừng, nông trại) vẽ bằng CSS + emoji, dùng chung cho Tìm và Dán hình. */
export function SceneBackdrop({ scene, children, innerRef }: { scene: SceneDef; children?: ReactNode; innerRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={innerRef} className="relative min-h-0 flex-1 touch-none overflow-hidden rounded-[28px] shadow-[inset_0_0_0_4px_white]" style={{ background: scene.background }}>
      {scene.id === 'ocean' && <Bubbles />}
      {scene.decor.map(([e, x, y, s], i) => (
        <span key={i} aria-hidden className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 leading-none" style={{ left: `${x}%`, top: `${y}%`, fontSize: `${s}vh` }}><Emoji glyph={e} className="block" /></span>
      ))}
      {children}
    </div>
  );
}

function Bubbles() {
  return (
    <>
      <style>{'@keyframes rise{from{transform:translateY(0);opacity:.8}to{transform:translateY(-70vh);opacity:0}}'}</style>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} aria-hidden className="pointer-events-none absolute rounded-full border-2 border-white/70"
          style={{ left: `${(i * 37) % 95 + 2}%`, bottom: '12%', width: 8 + (i % 4) * 5, height: 8 + (i % 4) * 5, animation: `rise ${5 + (i % 5)}s linear ${i * 0.7}s infinite` }} />
      ))}
    </>
  );
}
