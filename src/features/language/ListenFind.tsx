import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { TopBar } from '@/components/ui/TopBar';
import { TopicPicker } from '@/components/game/TopicPicker';
import { ChoiceCard, type ChoiceState } from '@/components/game/ChoiceCard';
import { RoundDots } from '@/components/game/RoundDots';
import { ResultModal, starsFor } from '@/components/game/ResultModal';
import { pictureTopics } from '@/data/games';
import { getTopic } from '@/data';
import { PHRASES } from '@/data/phrases';
import { shuffle } from '@/features/flashcards/buildDeck';
import { useNav } from '@/store/useNav';
import { useProgressStore } from '@/store/useProgressStore';
import { preloadVoice, sayAll, stopVoice } from '@/services/audio/voice';
import { feedbackCorrect, feedbackDone, feedbackWrong } from '@/services/audio/feedback';
import type { VocabItem } from '@/types/content';

const ROUNDS = 6;

/** Nghe & Tìm: cô đọc "Bé hãy chọn đúng hình con mèo", bé chạm đúng 1 trong 3 hình. */
export function ListenFind({ topicId }: { topicId?: string }) {
  const go = useNav((s) => s.go);
  const style = { '--c': 'var(--color-coral)' } as CSSProperties;
  const topic = topicId ? getTopic(topicId) : undefined;
  if (!topic) {
    return (
      <main className="room" style={style}>
        <TopBar title="Nghe và tìm" onBack={() => go({ name: 'hub', module: 'language-games' })} />
        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          <TopicPicker topics={pictureTopics(true)} onPick={(t) => go({ name: 'listen-find', topicId: t.id })} />
        </div>
      </main>
    );
  }
  return <ListenFindGame key={topic.id} items={topic.items} title={topic.title.vi} topicId={topic.id} />;
}

function ListenFindGame({ items, title, topicId }: { items: VocabItem[]; title: string; topicId: string }) {
  const go = useNav((s) => s.go);
  const { childName, addStars, recordGame } = useProgressStore();
  const [game, setGame] = useState(0);
  const targets = useMemo(() => shuffle(items).slice(0, ROUNDS), [items, game]);
  const [round, setRound] = useState(0);
  const [states, setStates] = useState<Record<string, ChoiceState>>({});
  const [shake, setShake] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState<1 | 2 | 3>(3);
  const firstTry = useRef(0);
  const missed = useRef(false);
  const busy = useRef(false);
  const target = targets[round];
  const choices = useMemo(
    () => shuffle([target, ...shuffle(items.filter((i) => i.id !== target.id)).slice(0, 2)]),
    [target, items],
  );
  const prompt = () => sayAll([PHRASES.pick, target.label.vi]);

  useEffect(() => {
    let off = false;
    setStates({});
    missed.current = false;
    busy.current = false;
    preloadVoice([PHRASES.pick, PHRASES.correct, PHRASES.tryAgain, ...items.map((i) => i.label.vi)], 'vi')
      .then(() => { if (!off) prompt(); });
    return () => { off = true; };
  }, [round, game]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopVoice(), []);

  const pick = async (it: VocabItem) => {
    if (busy.current) return;
    if (it.id !== target.id) {
      missed.current = true;
      setStates((s) => ({ ...s, [it.id]: 'wrong' }));
      setShake((k) => k + 1);
      await feedbackWrong(it.label.vi).done;
      return;
    }
    busy.current = true;
    if (!missed.current) firstTry.current++;
    setStates(Object.fromEntries(choices.map((c) => [c.id, c.id === it.id ? 'right' : 'dim'])));
    await feedbackCorrect(it.label.vi).done;
    await new Promise((r) => setTimeout(r, 400));
    if (round + 1 < targets.length) { setRound(round + 1); return; }
    const s = starsFor(firstTry.current, targets.length);
    setStars(s);
    setDone(true);
    recordGame(`listen-find-${topicId}`, s, { correct: firstTry.current, total: targets.length });
    addStars(s);
    feedbackDone(childName);
  };

  const again = () => { firstTry.current = 0; setDone(false); setRound(0); setGame((g) => g + 1); };

  return (
    <main className="room" style={{ '--c': 'var(--color-coral)' } as CSSProperties}>
      <TopBar title={`Nghe và tìm · ${title}`} onBack={() => { stopVoice(); go({ name: 'listen-find' }); }}
        right={<RoundDots total={targets.length} current={round} />} />
      <div className="flex justify-center">
        <button onClick={prompt} className="press inline-flex h-14 items-center gap-3 rounded-full px-6 font-display text-xl font-extrabold">
          🔊 Nghe lại
        </button>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-[3vw] py-2">
        {choices.map((c) => (
          <ChoiceCard key={`${round}-${c.id}`} visual={c.visual} state={states[c.id] ?? 'idle'}
            shakeKey={states[c.id] === 'wrong' ? shake : 0} onPick={() => pick(c)} size="min(30vh, 20vw)" />
        ))}
      </div>
      <ResultModal open={done} stars={stars} message={`${childName} nghe và tìm đúng ${targets.length} hình`}
        onAgain={again} onExit={() => go({ name: 'listen-find' })} exitLabel="Chủ đề khác" />
    </main>
  );
}
