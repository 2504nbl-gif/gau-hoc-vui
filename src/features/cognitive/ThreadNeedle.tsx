import { useEffect, useMemo, useRef, useState } from 'react';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { PHRASES } from '@/data/phrases';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect } from '@/services/audio/feedback';
import { sfx } from '@/services/audio/sfx';
import type { GameProps } from '@/features/registry';

// Đường chỉ trong hộp 1000×500, kết thúc ở lỗ kim (x≈880, y=250). Dễ → khó.
const PATHS = [
  'M80 250 L880 250',
  'M80 330 C260 120 420 380 600 200 S800 250 880 250',
  'M80 150 L240 360 L400 140 L560 360 L720 150 L880 250',
];
const TOL = 46;      // độ lệch cho phép (đơn vị hộp)
const ROUNDS = PATHS.length;

/** Xỏ chỉ qua kim: kéo đầu sợi chỉ đi theo đường chấm tới lỗ kim. Lệch xa quá thì chỉ tuột về điểm vừa qua. */
export function ThreadNeedle({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'thread-needle', rounds: ROUNDS });
  const d = PATHS[s.round];
  const svg = useRef<SVGSVGElement>(null);
  const pts = useMemo(() => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    const len = p.getTotalLength();
    const n = Math.ceil(len / 8);
    return Array.from({ length: n + 1 }, (_, i) => { const q = p.getPointAtLength((i / n) * len); return [q.x, q.y] as [number, number]; });
  }, [d]);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const checkpoint = useRef(0);

  useEffect(() => {
    setProgress(0); setDone(false); checkpoint.current = 0;
    preloadVoice([PHRASES.threadHint, PHRASES.threadOff], 'vi').then(() => say(PHRASES.threadHint));
  }, [d]);

  const toBox = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 1000, ((e.clientY - r.top) / r.height) * 500];
  };

  const onMove = async (e: React.PointerEvent) => {
    if (!dragging || done) return;
    const [x, y] = toBox(e);
    // Chỉ cho tiến tới các điểm ngay phía trước (không nhảy cóc).
    let best = progress;
    for (let j = progress; j < Math.min(pts.length, progress + 12); j++) {
      if (Math.hypot(pts[j][0] - x, pts[j][1] - y) < TOL) best = j;
    }
    const head = pts[progress];
    if (Math.hypot(head[0] - x, head[1] - y) > TOL * 2.6 && best === progress) {
      // Tuột chỉ: quay về mốc gần nhất.
      setDragging(false);
      s.miss();
      sfx.wrong();
      say(PHRASES.threadOff);
      setProgress(checkpoint.current);
      return;
    }
    if (best !== progress) {
      setProgress(best);
      if (best - checkpoint.current > 20) checkpoint.current = best;
      if (best >= pts.length - 1) {
        setDone(true); setDragging(false);
        await feedbackCorrect().done;
        setTimeout(s.win, 400);
      }
    }
  };

  const head = pts[progress];
  const trail = pts.slice(0, progress + 1).map((p) => p.join(',')).join(' ');

  return (
    <GameScreen title="Xỏ chỉ qua kim" color="peach" session={s} rounds={ROUNDS} onExit={onExit} onReplay={() => say(PHRASES.threadHint)}>
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-[28px] bg-paper p-2 shadow-[0_5px_0_var(--color-line)]">
        <svg ref={svg} viewBox="0 0 1000 500" className="max-h-full w-full touch-none"
          onPointerDown={(e) => { const [x, y] = toBox(e); if (Math.hypot(head[0] - x, head[1] - y) < TOL * 1.8) { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); sfx.tap(); } }}
          onPointerMove={onMove} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)}>
          {/* Cây kim */}
          <g transform="translate(880 250)">
            <path d="M-6 -150 Q0 -175 6 -150 L10 170 Q0 200 -10 170 Z" fill="#c9d3de" stroke="#8a97a6" strokeWidth="3" />
            <ellipse cx="0" cy="0" rx="7" ry="26" fill="#fff" stroke="#8a97a6" strokeWidth="3" />
          </g>
          <path d={d} fill="none" stroke="#f2c7a5" strokeWidth="18" strokeLinecap="round" strokeDasharray="2 26" />
          <polyline points={trail} fill="none" stroke="#e0547b" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          {!done && (
            <g transform={`translate(${head[0]} ${head[1]})`}>
              <circle r="34" fill="#e0547b" opacity=".18"><animate attributeName="r" values="28;40;28" dur="1.2s" repeatCount="indefinite" /></circle>
              <circle r="18" fill="#e0547b" stroke="#fff" strokeWidth="5" />
            </g>
          )}
          {progress === 0 && !dragging && <text x={Math.max(24, pts[0][0] - 50)} y={pts[0][1] - 52} textAnchor="start" fontSize="30" fontWeight="800" fill="#68788e" fontFamily="Nunito,sans-serif">Kéo từ đây 👆</text>}
          {done && <text x="500" y="80" textAnchor="middle" fontSize="60" fontWeight="800" fill="#4db463" fontFamily="Baloo 2,Nunito,sans-serif">Xỏ được rồi! 🎉</text>}
        </svg>
      </div>
    </GameScreen>
  );
}
