import { useEffect, useState } from 'react';
import { CardVisual } from '@/components/content/CardVisual';
import { GameScreen } from '@/components/game/GameScreen';
import { TraceCanvas } from '@/components/game/TraceCanvas';
import { useGameSession } from '@/components/game/useGameSession';
import { TRACE_SHAPES } from '@/data/art';
import { PHRASES } from '@/data/phrases';
import { preloadVoice, say } from '@/services/audio/voice';
import { feedbackCorrect } from '@/services/audio/feedback';
import type { ShapeId } from '@/types/content';
import type { GameProps } from '@/features/registry';

/** Học hình dạng: tô theo nét chấm và mũi tên, xong thì hình hiện màu và cô đọc tên. */
export function TraceShapes({ onExit }: GameProps) {
  const s = useGameSession({ resultId: 'trace-shapes', rounds: TRACE_SHAPES.length });
  const shape = TRACE_SHAPES[s.round];
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    setSolved(false);
    preloadVoice([PHRASES.traceHint, ...TRACE_SHAPES.map((x) => x.name)], 'vi').then(() => say(PHRASES.traceHint));
  }, [shape]);

  const done = async () => {
    setSolved(true);
    await feedbackCorrect(shape.name).done;
    setTimeout(s.win, 700);
  };

  return (
    <GameScreen title={`Tô hình · ${shape.name}`} color="berry" session={s} rounds={TRACE_SHAPES.length} onExit={onExit} onReplay={() => say(PHRASES.traceHint)}>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-[4vw]">
        <div className="hidden flex-col items-center gap-2 sm:flex">
          <span className="rounded-full bg-paper px-3 py-1 text-sm font-extrabold text-soft">Hình mẫu</span>
          <div className="grid place-items-center rounded-3xl bg-paper p-4 shadow-[0_5px_0_var(--color-line)]">
            <CardVisual visual={{ kind: 'shape', shape: shape.id as ShapeId, color: shape.color }} size="min(16vh, 11vw)" />
          </div>
        </div>
        <div className="relative">
          <TraceCanvas key={`${s.game}-${shape.id}`} strokes={shape.strokes} color={shape.color} onDone={done} />
          {solved && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <CardVisual visual={{ kind: 'shape', shape: shape.id as ShapeId, color: shape.color }} size="min(40vh, 30vw)" />
            </div>
          )}
        </div>
      </div>
    </GameScreen>
  );
}
