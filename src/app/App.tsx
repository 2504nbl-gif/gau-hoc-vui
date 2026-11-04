import { useNav } from '@/store/useNav';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { FlashcardHome } from '@/features/flashcards/FlashcardHome';
import { FlashcardPlayer } from '@/features/flashcards/FlashcardPlayer';
import { StoryLibrary } from '@/features/stories/StoryLibrary';
import { StoryPlayer } from '@/features/stories/StoryPlayer';
import { DiscoveryHome } from '@/features/discovery/DiscoveryHome';
import { MagnifierGame } from '@/features/discovery/MagnifierGame';
import { GameHub } from '@/features/hub/GameHub';
import { gameById } from '@/features/registry';
import { ListenFind } from '@/features/language/ListenFind';
import { SceneHunt } from '@/features/language/SceneHunt';
import { StickerScene } from '@/features/language/StickerScene';
import { DailyPath } from '@/features/daily/DailyPath';
import { RotateHint } from '@/components/ui/RotateHint';
import { ParentGate } from '@/features/parent/ParentGate';
import { ParentCorner } from '@/features/parent/ParentCorner';
import { AppSession } from '@/features/parent/AppSession';
import { StickerBook } from '@/features/rewards/StickerBook';
import { Fireworks } from '@/components/game/Fireworks';
import { RewardLayer } from '@/features/rewards/RewardLayer';
import { FamilyPhotos } from '@/features/family/FamilyPhotos';
import { useFamilyStore } from '@/store/useFamilyStore';
import { useEffect } from 'react';

/** Khung app: chọn màn hình theo route. Mỗi giai đoạn thêm nhánh mới ở đây. */
export function App() {
  const route = useNav((s) => s.route);
  useEffect(() => { void useFamilyStore.getState().load(); }, []);
  return (
    <>
      {route.name === 'dashboard' && <><Dashboard /><ParentGate /></>}
      {route.name === 'daily' && <DailyPath />}
      {route.name === 'flashcards' && <FlashcardHome />}
      {route.name === 'flashcard-player' && <FlashcardPlayer topicIds={route.topicIds} />}
      {route.name === 'discovery' && <DiscoveryHome key={route.topicId ?? 'all'} topicId={route.topicId} />}
      {route.name === 'magnifier' && <MagnifierGame key={`${route.topicId}-${route.lesson}`} topicId={route.topicId} lesson={route.lesson} />}
      {route.name === 'hub' && <GameHub module={route.module} />}
      {route.name === 'play' && <PlayRoute game={route.game} arg={route.arg} />}
      {route.name === 'listen-find' && <ListenFind topicId={route.topicId} />}
      {route.name === 'scene-hunt' && <SceneHunt key={route.scene} scene={route.scene} />}
      {route.name === 'sticker' && <StickerScene />}
      {route.name === 'sticker-book' && <StickerBook />}
      {route.name === 'stories' && <StoryLibrary />}
      {route.name === 'story-player' && <StoryPlayer storyId={route.storyId} />}
      {route.name === 'parent' && <ParentCorner />}
      <AppSession />
      <Fireworks />
      <RewardLayer />
      {route.name === 'family-photos' && <FamilyPhotos />}
      <RotateHint />
    </>
  );
}

/** Chạy một trò trong registry; thoát thì về màn hình module của trò đó. */
function PlayRoute({ game, arg }: { game: string; arg?: string }) {
  const go = useNav((s) => s.go);
  const g = gameById(game);
  if (!g?.render) return null;
  return <div key={`${game}-${arg}`} className="contents">{g.render({ arg, onExit: () => go({ name: 'hub', module: g.module }) })}</div>;
}
