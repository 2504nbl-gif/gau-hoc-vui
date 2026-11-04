import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { STORIES } from '@/data/stories';
import { PHRASES } from '@/data/phrases';
import { TopBar } from '@/components/ui/TopBar';
import { PressButton } from '@/components/ui/PressButton';
import { CardVisual } from '@/components/content/CardVisual';
import { useNav } from '@/store/useNav';
import { useProgressStore } from '@/store/useProgressStore';
import { preloadVoice, say, stopVoice } from '@/services/audio/voice';
import { sfx } from '@/services/audio/sfx';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Trình đọc thơ/truyện có karaoke: chữ đang đọc sáng lên, chữ đã đọc đậm màu,
 * chữ chưa đọc nhạt. Mốc thời gian lấy từ gói giọng (hoặc ước lượng nếu dùng giọng máy).
 */
export function StoryPlayer({ storyId }: { storyId: string }) {
  const go = useNav((s) => s.go);
  const addStars = useProgressStore((s) => s.addStars);
  const story = STORIES.find((s) => s.id === storyId)!;
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState(-1); // -1 = tiêu đề
  const [word, setWord] = useState(-1);
  const runId = useRef(0);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  const stop = useCallback(() => { runId.current++; stopVoice(); setPlaying(false); }, []);

  const readLine = (i: number, id: number) => {
    const text = i < 0 ? story.title : story.lines[i];
    setLine(i);
    setWord(-1);
    return say(text, story.lang, { onWord: (w) => { if (runId.current === id) setWord(w); } }).done;
  };

  const playFrom = useCallback(async (from: number) => {
    const id = ++runId.current;
    setPlaying(true);
    for (let i = from; i < story.lines.length; i++) {
      const finished = await readLine(i, id);
      if (runId.current !== id || !finished) return;
      setWord(story.lines[i].split(' ').length); // cả dòng đã đọc
      await wait(story.kind === 'story' ? 450 : 650);
      if (runId.current !== id) return;
    }
    setPlaying(false);
    setLine(story.lines.length);
    sfx.success();
    addStars(1, 2); // xong bài: được sticker
    await wait(400);
    if (runId.current === id) say(PHRASES.storyDone, 'vi');
  }, [story]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mở bài: tải giọng, đọc tên bài rồi tự đọc luôn (bé 2 tuổi không cần bấm thêm).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await preloadVoice([story.title, ...story.lines], story.lang);
      if (cancelled) return;
      setReady(true);
      const id = ++runId.current;
      setPlaying(true);
      const ok = await readLine(-1, id);
      if (cancelled || runId.current !== id || !ok) return;
      await wait(500);
      if (!cancelled && runId.current === id) void playFrom(0);
    })();
    return () => { cancelled = true; runId.current++; stopVoice(); };
  }, [storyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    lineRefs.current[line]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [line]);

  const big = story.lines.length <= 5;

  return (
    <main className="room" style={{ '--c': 'var(--color-sea)' } as CSSProperties}>
      <TopBar title={story.title} onBack={() => { stop(); go({ name: 'stories' }); }} />

      <div className="flex min-h-0 flex-1 items-center gap-6">
        <motion.div
          className="hidden flex-none sm:block"
          animate={playing ? { y: [0, -10, 0], rotate: [0, -3, 0] } : { y: 0 }}
          transition={{ duration: 2.4, repeat: playing ? Infinity : 0, ease: 'easeInOut' }}
        >
          <div className="grid size-[min(34vh,26vw)] place-items-center rounded-full bg-paper shadow-[0_8px_0_var(--color-line)]">
            <CardVisual visual={story.cover} size="min(20vh,15vw)" />
          </div>
        </motion.div>

        <div className="min-h-0 min-w-0 flex-1 self-stretch overflow-y-auto rounded-[28px] bg-paper px-5 py-4">
          <div className="flex min-h-full flex-col justify-center gap-1">
            {story.lines.map((text, i) => {
              const state = i < line ? 'past' : i === line ? 'now' : 'future';
              return (
                <p
                  key={i}
                  ref={(el) => { lineRefs.current[i] = el; }}
                  onClick={() => { const id = ++runId.current; setPlaying(true); readLine(i, id).then(() => { if (runId.current === id) setPlaying(false); }); }}
                  className={`m-0 cursor-pointer rounded-2xl px-3 py-1 font-display font-bold leading-snug transition-all duration-300 ${
                    state === 'now' ? 'bg-sun/15' : ''
                  }`}
                  style={{ fontSize: state === 'now' ? (big ? 'min(7vh,4.6vw)' : 'min(5.6vh,3.8vw)') : big ? 'min(5vh,3.4vw)' : 'min(4vh,2.8vw)' }}
                >
                  {text.split(' ').map((w, k) => {
                    const lit = state === 'past' || (state === 'now' && k < word);
                    const cur = state === 'now' && k === word;
                    return (
                      <span key={k}>
                        <span
                          className={`inline-block rounded-lg px-0.5 transition-colors duration-150 ${
                            cur ? 'scale-110 bg-sun text-ink' : lit ? 'text-sea' : state === 'now' ? 'text-ink' : 'text-soft/60'
                          }`}
                        >
                          {w}
                        </span>{' '}
                      </span>
                    );
                  })}
                </p>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-3">
        {!ready ? (
          <span className="font-bold text-soft">Cô giáo đang mở sách…</span>
        ) : playing ? (
          <PressButton size="lg" variant="ghost" onClick={stop}>■ Dừng</PressButton>
        ) : (
          <>
            <PressButton size="lg" color="sea" onClick={() => playFrom(line >= 0 && line < story.lines.length ? line : 0)}>
              ▶ {line > 0 && line < story.lines.length ? 'Đọc tiếp' : 'Nghe đọc'}
            </PressButton>
            <PressButton size="lg" variant="ghost" onClick={() => playFrom(0)}>↺ Đọc lại từ đầu</PressButton>
          </>
        )}
      </footer>
    </main>
  );
}
