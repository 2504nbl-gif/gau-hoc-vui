import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { TopBar } from '@/components/ui/TopBar';
import { CardVisual } from '@/components/content/CardVisual';
import { RoundDots } from '@/components/game/RoundDots';
import { ResultModal, starsFor } from '@/components/game/ResultModal';
import { SCENES, type SceneId } from '@/data/games';
import { getTopic } from '@/data';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { useNav } from '@/store/useNav';
import { useProgressStore } from '@/store/useProgressStore';
import { preloadVoice, sayAll, stopVoice } from '@/services/audio/voice';
import { feedbackCorrect, feedbackDone, feedbackWrong } from '@/services/audio/feedback';
import { SceneBackdrop } from './SceneBackdrop';

const COUNT = 5;

/** Đại dương / Rừng rậm: các bạn bơi hoặc ló ra trong cảnh, cô gọi tên, bé chạm đúng bạn đó. */
export function SceneHunt({ scene: sceneId }: { scene: SceneId }) {
  const go = useNav((s) => s.go);
  const { childName, addStars, recordGame } = useProgressStore();
  const scene = SCENES[sceneId];
  const items = getTopic(scene.topicId)!.items;
  const [game, setGame] = useState(0);

  // Chọn 5 bạn, đặt vào 6 ô rải đều trong cảnh (có lệch ngẫu nhiên cho tự nhiên).
  const actors = useMemo(() => {
    const yBand = scene.motion === 'swim' ? [26, 60] : [46, 76];
    const slots = shuffle(Array.from({ length: 6 }, (_, i) => i)).slice(0, COUNT);
    return shuffle(items).slice(0, COUNT).map((item, k) => {
      const s = slots[k];
      return { item, x: 14 + (s % 3) * 34 + (Math.random() * 8 - 4), y: yBand[Math.floor(s / 3)] + (Math.random() * 6 - 3), speed: 3 + Math.random() * 2 };
    });
  }, [items, scene.motion, game]);
  const order = useMemo(() => shuffle(actors), [actors]);

  const [round, setRound] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [wrongId, setWrongId] = useState<{ id: string; k: number } | null>(null);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState<1 | 2 | 3>(3);
  const firstTry = useRef(0);
  const missed = useRef(false);
  const busy = useRef(false);
  const target = order[round];
  const prompt = () => sayAll([PHRASES.find, target.item.label.vi]);

  useEffect(() => {
    let off = false;
    missed.current = false;
    busy.current = false;
    preloadVoice([PHRASES.find, PHRASES.correct, PHRASES.tryAgain, ...items.map((i) => i.label.vi)], 'vi')
      .then(() => { if (!off) prompt(); });
    return () => { off = true; };
  }, [round, game]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopVoice(), []);

  const tap = async (id: string) => {
    if (busy.current || found.includes(id)) return;
    const a = actors.find((x) => x.item.id === id)!;
    if (id !== target.item.id) {
      missed.current = true;
      setWrongId({ id, k: Date.now() });
      feedbackWrong(a.item.label.vi);
      return;
    }
    busy.current = true;
    if (!missed.current) firstTry.current++;
    setFound((f) => [...f, id]);
    await feedbackCorrect(a.item.label.vi).done;
    await new Promise((r) => setTimeout(r, 300));
    if (round + 1 < order.length) { setRound(round + 1); return; }
    const s = starsFor(firstTry.current, order.length);
    setStars(s);
    setDone(true);
    recordGame(`scene-${sceneId}`, s, { correct: firstTry.current, total: order.length });
    addStars(s);
    feedbackDone(childName);
  };

  const again = () => { firstTry.current = 0; setFound([]); setRound(0); setDone(false); setGame((g) => g + 1); };

  return (
    <main className="room" style={{ '--c': `var(--color-${sceneId === 'ocean' ? 'sea' : 'leaf'})` } as CSSProperties}>
      <TopBar title={scene.title} onBack={() => { stopVoice(); go({ name: 'hub', module: 'language-games' }); }}
        right={<>
          <RoundDots total={order.length} current={round} />
          <button onClick={prompt} className="press h-11 rounded-2xl px-4 font-extrabold">🔊</button>
        </>} />
      <SceneBackdrop scene={scene}>
        {actors.map((a, i) => {
          const isFound = found.includes(a.item.id);
          const shaking = wrongId?.id === a.item.id;
          const idle = scene.motion === 'swim'
            ? { x: ['-3vw', '3vw', '-3vw'], y: [0, -8, 0] }
            : { y: [0, -14, 0], rotate: [0, -4, 4, 0] };
          return (
            <motion.button
              key={`${game}-${a.item.id}`}
              aria-label={a.item.label.vi}
              onClick={() => tap(a.item.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-2"
              style={{ left: `${a.x}%`, top: `${a.y}%` }}
              initial={{ scale: 0 }}
              animate={{ scale: isFound ? [1, 1.35, 1.1] : 1 }}
              transition={{ duration: 0.5, delay: isFound ? 0 : i * 0.12 }}
            >
              {/* Lớp bơi/ló đầu lặp mãi, tách riêng để không lặp lại hiệu ứng xuất hiện */}
              <motion.span className="block" animate={isFound ? { x: 0, y: 0, rotate: 0 } : idle}
                transition={isFound ? { duration: 0.3 } : { duration: a.speed, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}>
                <motion.span key={shaking ? wrongId!.k : 0} className="block" animate={shaking ? { rotate: [0, -15, 15, -10, 0] } : {}} transition={{ duration: 0.45 }}>
                  <CardVisual visual={a.item.visual} size="min(16vh, 11vw)" />
                </motion.span>
              </motion.span>
              {isFound && (
                <span className="absolute -top-1 -right-1 grid size-9 place-items-center rounded-full bg-leaf text-lg font-extrabold text-white shadow">✓</span>
              )}
            </motion.button>
          );
        })}
      </SceneBackdrop>
      <ResultModal open={done} stars={stars} message={`${childName} tìm được cả ${order.length} bạn`}
        onAgain={again} onExit={() => go({ name: 'hub', module: 'language-games' })} />
    </main>
  );
}
