import { useEffect, useMemo, useRef, useState } from 'react';
import { emojiKey } from '@/components/content/Emoji';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { MAZES } from '@/data/logic';
import { PHRASES } from '@/data/phrases';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect } from '@/services/audio/feedback';
import { aimAt } from '@/components/game/Fireworks';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

const ROUNDS = MAZES.length;
const C = 100; // cạnh một ô trong hệ tọa độ SVG
const BEAR = 'Con gấu';
const HONEY = 'Hũ mật ong';
type Pt = [number, number];
const key = (a: Pt, b: Pt) => `${a[0]},${a[1]}|${b[0]},${b[1]}`;
const mid = (n: number) => n * C + C / 2;

/** Hình emoji 3D đặt giữa điểm (0,0) của nhóm SVG. */
const Img = ({ glyph, size, opacity }: { glyph: string; size: number; opacity?: number }) => (
  <image href={`emoji/${emojiKey(glyph)}.webp`} x={-size / 2} y={-size / 2} width={size} height={size} opacity={opacity} />
);

/**
 * Mê cung: kéo chú gấu đi theo đường tới hũ mật. Gấu chỉ bước sang ô kề có đường nối;
 * gặp bụi cỏ thì đứng yên chờ (không phạt). Ngón tay phải ở gần gấu thì gấu mới đi theo.
 */
export function MazeGame({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'maze', rounds: ROUNDS });
  const maze = MAZES[s.round];
  const svg = useRef<SVGSVGElement>(null);
  const { edges, lines, bushes } = useMemo(() => {
    const edges = new Set<string>();
    const lines: [Pt, Pt][] = [];
    const road = new Set<string>();
    for (const [x1, y1, x2, y2] of maze.segs) {
      const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
      for (let x = x1, y = y1; x !== x2 || y !== y2; x += dx, y += dy) {
        const a: Pt = [x, y], b: Pt = [x + dx, y + dy];
        edges.add(key(a, b)); edges.add(key(b, a)); lines.push([a, b]);
        road.add(`${a}`); road.add(`${b}`);
      }
    }
    const bushes: [number, number, string][] = [];
    for (let y = 0; y < maze.h; y++) for (let x = 0; x < maze.w; x++) {
      if (!road.has(`${x},${y}`)) bushes.push([x, y, ['🌳', '🌷', '🌻', '🍄'][(x * 3 + y * 5) % 4]]);
    }
    return { edges, lines, bushes };
  }, [maze]);

  const [pos, setPos] = useState<Pt>(maze.start);
  const [trail, setTrail] = useState<Pt[]>([]);
  const [done, setDone] = useState(false);
  const at = useRef<Pt>(maze.start);
  const drag = useRef({ on: false, moved: false });

  useEffect(() => {
    at.current = maze.start;
    setPos(maze.start); setTrail([]); setDone(false);
    preloadVoice([PHRASES.mazeHint, PHRASES.mazeDone, BEAR, HONEY], 'vi').then(() => say(PHRASES.mazeHint));
  }, [maze, s.game]);

  /** Vị trí ngón tay theo đơn vị ô (0 = tâm ô đầu). */
  const toCell = (e: React.PointerEvent): Pt => {
    const m = svg.current!.getScreenCTM()!.inverse();
    return [(e.clientX * m.a + e.clientY * m.c + m.e) / C - 0.5, (e.clientX * m.b + e.clientY * m.d + m.f) / C - 0.5];
  };

  const follow = (e: React.PointerEvent) => {
    if (done) return;
    const [px, py] = toCell(e);
    let cur = at.current;
    const walked: Pt[] = [];
    for (let k = 0; k < 3; k++) {
      const dx = px - cur[0], dy = py - cur[1];
      if (Math.hypot(dx, dy) > 1.7 || Math.max(Math.abs(dx), Math.abs(dy)) < 0.55) break;
      const horiz: Pt = [cur[0] + Math.sign(dx), cur[1]], vert: Pt = [cur[0], cur[1] + Math.sign(dy)];
      const [first, second, minor] = Math.abs(dx) >= Math.abs(dy) ? [horiz, vert, Math.abs(dy)] : [vert, horiz, Math.abs(dx)];
      const next = edges.has(key(cur, first)) ? first : minor > 0.3 && edges.has(key(cur, second)) ? second : null;
      if (!next) break; // bụi cỏ chắn đường: gấu đứng chờ
      walked.push(cur);
      cur = next;
    }
    if (!walked.length) return;
    drag.current.moved = true;
    at.current = cur;
    setPos(cur);
    setTrail((t) => [...t, ...walked]);
    sfx.tap();
    if (cur[0] === maze.goal[0] && cur[1] === maze.goal[1]) void finish(e);
  };

  const finish = async (e: React.PointerEvent) => {
    setDone(true);
    drag.current.on = false;
    aimAt(e.clientX, e.clientY);
    await feedbackCorrect().done;
    await say(PHRASES.mazeDone).done;
    setTimeout(s.win, 400);
  };

  const W = maze.w * C, H = maze.h * C;
  return (
    <GameScreen title="Mê cung" color="leaf" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.mazeHint)}>
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-[28px] p-2 shadow-[0_5px_0_#6fb04a]"
        style={{ background: 'radial-gradient(120% 90% at 50% 0%, #b7e58a, #8fcb5c)' }}>
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="size-full touch-none" data-maze
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { on: true, moved: false }; follow(e); }}
          onPointerMove={(e) => drag.current.on && follow(e)}
          onPointerUp={(e) => {
            const d = drag.current; drag.current = { on: false, moved: false };
            if (d.on && !d.moved && !done) {
              const [px, py] = toCell(e);
              if (Math.hypot(px - pos[0], py - pos[1]) < 0.6) say(BEAR);
              else if (Math.hypot(px - maze.goal[0], py - maze.goal[1]) < 0.6) say(HONEY);
            }
          }}
          onPointerCancel={() => { drag.current.on = false; }}>
          {bushes.map(([x, y, g]) => (
            <g key={`${x}-${y}`} transform={`translate(${mid(x)} ${mid(y)})`}><Img glyph={g} size={g === '🌳' ? 70 : 44} opacity={0.9} /></g>
          ))}
          {/* Đường đi: viền nâu + mặt đường cát */}
          {[['#c9a868', 76], ['#fbeecb', 64]].map(([color, width]) => (
            <g key={color} stroke={color as string} strokeWidth={width} strokeLinecap="round">
              {lines.map(([a, b], i) => <line key={i} x1={mid(a[0])} y1={mid(a[1])} x2={mid(b[0])} y2={mid(b[1])} />)}
            </g>
          ))}
          {trail.map(([x, y], i) => (
            <g key={i} transform={`translate(${mid(x)} ${mid(y)})`}><Img glyph="🐾" size={30} opacity={0.45} /></g>
          ))}
          <g transform={`translate(${mid(maze.goal[0])} ${mid(maze.goal[1])})`}>
            {!done && <circle r="40" fill="#f2b23a" opacity=".3"><animate attributeName="r" values="34;46;34" dur="1.4s" repeatCount="indefinite" /></circle>}
            <Img glyph="🍯" size={done ? 0 : 62} />
          </g>
          <g data-bear style={{ transform: `translate(${mid(pos[0])}px, ${mid(pos[1])}px)`, transition: 'transform .16s ease-out' }}>
            {trail.length === 0 && <circle r="40" fill="#fff" opacity=".5"><animate attributeName="r" values="36;50;36" dur="1.2s" repeatCount="indefinite" /></circle>}
            <Img glyph="🐻" size={done ? 84 : 72} />
            {done && <g transform="translate(34 22)"><Img glyph="🍯" size={44} /></g>}
          </g>
        </svg>
      </div>
    </GameScreen>
  );
}
