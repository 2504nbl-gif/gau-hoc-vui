import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { TopBar } from '@/components/ui/TopBar';
import { Segmented } from '@/components/ui/Segmented';
import { PressButton } from '@/components/ui/PressButton';
import { CardVisual } from '@/components/content/CardVisual';
import { SCENES, type SceneId } from '@/data/games';
import { getTopic } from '@/data';
import { PHRASES } from '@/data/phrases';
import { useNav } from '@/store/useNav';
import { say, preloadVoice, stopVoice } from '@/services/audio/voice';
import { sfx } from '@/services/audio/sfx';
import type { VocabItem } from '@/types/content';
import { SceneBackdrop } from './SceneBackdrop';

interface Placed { key: number; item: VocabItem; x: number; y: number }
interface Drag { item: VocabItem; fromKey?: number; x: number; y: number; startX: number; startY: number }

const SIZE = 'min(13vh, 9vw)';

/** Dán hình: bé kéo con vật từ khay vào tranh. Thả vào là cô đọc tên; chạm hình đã dán để nghe lại; kéo ra ngoài để bỏ. */
export function StickerScene() {
  const go = useNav((s) => s.go);
  const [sceneId, setSceneId] = useState<SceneId>('farm');
  const scene = SCENES[sceneId];
  const items = getTopic(scene.topicId)!.items;
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [wiggle, setWiggle] = useState<{ key: number; n: number } | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const nextKey = useRef(1);

  useEffect(() => {
    preloadVoice([PHRASES.dragHint, PHRASES.clearAll, scene.title, ...items.map((i) => i.label.vi)], 'vi').then(() => say(PHRASES.dragHint));
  }, [sceneId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopVoice(), []);

  // Kéo thả bằng Pointer Events thuần (chạy tốt trên màn hình cảm ứng).
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    const up = (e: PointerEvent) => {
      const d = drag;
      setDrag(null);
      const r = sceneRef.current?.getBoundingClientRect();
      const moved = Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 8;
      if (d.fromKey && !moved) { // chạm, không kéo → đọc tên
        setWiggle({ key: d.fromKey, n: Date.now() });
        say(d.item.label.vi);
        return;
      }
      const inside = r && e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
      if (!inside || !r) {
        if (d.fromKey) { sfx.pop(); setPlaced((p) => p.filter((x) => x.key !== d.fromKey)); }
        return;
      }
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      if (d.fromKey) {
        setPlaced((p) => p.map((s) => (s.key === d.fromKey ? { ...s, x, y } : s)));
      } else {
        const key = nextKey.current++;
        setPlaced((p) => [...p, { key, item: d.item, x, y }]);
        setWiggle({ key, n: Date.now() });
      }
      sfx.pop();
      say(d.item.label.vi);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
    window.addEventListener('pointercancel', () => setDrag(null), { once: true });
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [drag?.item, drag?.fromKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const startDrag = (e: React.PointerEvent, item: VocabItem, fromKey?: number) => {
    e.preventDefault();
    sfx.tap();
    setDrag({ item, fromKey, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY });
  };

  return (
    <main className="room" style={{ '--c': 'var(--color-sun)' } as CSSProperties}>
      <TopBar title="Dán hình" onBack={() => { stopVoice(); go({ name: 'hub', module: 'language-games' }); }}
        right={<PressButton variant="ghost" onClick={() => { setPlaced([]); say(PHRASES.clearAll); }}>🧽 Xóa hết</PressButton>} />
      <div className="flex justify-center">
        <Segmented<SceneId> label="Chọn tranh" value={sceneId}
          onChange={(v) => { setSceneId(v); setPlaced([]); say(SCENES[v].title); }}
          options={(['farm', 'ocean', 'jungle'] as SceneId[]).map((id) => ({ value: id, label: `${SCENES[id].icon} ${SCENES[id].title}` }))} />
      </div>

      <SceneBackdrop scene={scene} innerRef={sceneRef}>
        {placed.map((p) => (
          <motion.div
            key={p.key}
            onPointerDown={(e) => startDrag(e, p.item, p.key)}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab"
            style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: drag?.fromKey === p.key ? 0.25 : 1 }}
            initial={{ scale: 0 }}
            animate={wiggle?.key === p.key ? { scale: [1.3, 1], rotate: [0, -12, 12, 0] } : { scale: 1 }}
            transition={{ duration: 0.45 }}
          >
            <CardVisual visual={p.item.visual} size={SIZE} />
          </motion.div>
        ))}
        {placed.length === 0 && (
          <p className="pointer-events-none absolute inset-x-0 top-1/2 m-0 -translate-y-1/2 text-center font-display text-2xl font-extrabold text-white [text-shadow:0_2px_6px_rgba(0,0,0,.35)]">
            Kéo hình ở dưới vào đây
          </p>
        )}
      </SceneBackdrop>

      {/* Khay hình */}
      <div className="flex gap-2 overflow-x-auto rounded-[22px] bg-paper p-2 shadow-[0_5px_0_var(--color-line)]">
        {items.map((it) => (
          <button key={it.id} aria-label={it.label.vi} onPointerDown={(e) => startDrag(e, it)}
            className="grid size-[min(15vh,84px)] flex-none touch-none place-items-center rounded-2xl bg-cloud">
            <CardVisual visual={it.visual} size="min(10vh, 56px)" />
          </button>
        ))}
      </div>

      {drag && (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 scale-110 drop-shadow-xl" style={{ left: drag.x, top: drag.y }}>
          <CardVisual visual={drag.item.visual} size={SIZE} />
        </div>
      )}
    </main>
  );
}
