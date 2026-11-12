// Danh sách mọi trò chơi, xếp theo module. Màn hình module (GameHub) và router đọc từ đây.
// Thêm trò mới: viết component nhận GameProps rồi thêm 1 dòng vào GAMES.
import type { ReactNode } from 'react';
import { GAME_META, type GameMeta } from '@/data/gameList';
import type { Route } from '@/store/useNav';
import { ShadowMatch } from './cognitive/ShadowMatch';
import { EggCount, FlowerPot, HiddenCount, MissingNumber, SoundQuiz } from './cognitive/choiceGames';
import { SequenceGame } from './cognitive/SequenceGame';
import { ColorTower } from './cognitive/ColorTower';
import { RotateGrid } from './cognitive/RotateGrid';
import { ThreadNeedle } from './cognitive/ThreadNeedle';
import { DressUp } from './cognitive/DressUp';
import { MemoryGame } from './cognitive/MemoryGame';
import { TraceShapes } from './art/TraceShapes';
import { Coloring } from './art/Coloring';
import { FreeDraw } from './art/FreeDraw';
import { Gallery } from './art/Gallery';
import { Piano } from './music/Piano';
import { NoteDrag } from './music/NoteDrag';
import { NumberLesson } from './math/NumberLesson';
import { Compare } from './math/Compare';
import { ColorSort } from './montessori/ColorSort';
import { BigSmall } from './montessori/BigSmall';
import { MomBaby } from './montessori/MomBaby';
import { SockPair } from './focus/SockPair';
import { CupShuffle } from './focus/CupShuffle';
import { Curtain } from './focus/Curtain';
import { HammerNails } from './focus/HammerNails';
import { BlowBalloon, BlowBoat, BlowBubbles, BlowPinwheel } from './blow/scenes';
// Nhóm trò 3 tuổi — Toán sớm, Ngôn ngữ, Cảm xúc
import { ShareTreats } from './early/ShareTreats';
import { BalanceScale } from './early/BalanceScale';
import { CountTouch } from './early/CountTouch';
import { HowFeel, Opposites, WhereBear } from './early/choiceGames';

export interface GameProps { onExit: () => void; arg?: string }

export interface GameEntry extends GameMeta {
  render?: (p: GameProps) => ReactNode;
}

const RENDERS: Record<string, (p: GameProps) => ReactNode> = {
  'shadow-match': (p) => <ShadowMatch {...p} />,
  'hidden-count': (p) => <HiddenCount {...p} />,
  'sequence': (p) => <SequenceGame {...p} />,
  'color-tower': (p) => <ColorTower {...p} />,
  'rotate-grid': (p) => <RotateGrid {...p} />,
  'thread-needle': (p) => <ThreadNeedle {...p} />,
  'dress-up': (p) => <DressUp {...p} />,
  'memory-2x2': (p) => <MemoryGame {...p} />,
  'memory-2x3': (p) => <MemoryGame {...p} />,
  'memory-3x4': (p) => <MemoryGame {...p} />,
  'trace-shapes': (p) => <TraceShapes {...p} />,
  'coloring': (p) => <Coloring {...p} />,
  'free-draw': (p) => <FreeDraw {...p} />,
  'gallery': (p) => <Gallery {...p} />,
  'piano': (p) => <Piano {...p} />,
  'piano-drag': (p) => <NoteDrag {...p} />,
  'sound-quiz': (p) => <SoundQuiz {...p} />,
  'number-lesson': (p) => <NumberLesson {...p} />,
  'egg-count': (p) => <EggCount {...p} />,
  'missing-number': (p) => <MissingNumber {...p} />,
  'flower-pot': (p) => <FlowerPot {...p} />,
  'compare': (p) => <Compare {...p} />,
  'color-sort': (p) => <ColorSort {...p} />,
  'big-small': (p) => <BigSmall {...p} />,
  'mom-baby': (p) => <MomBaby {...p} />,
  'sock-pair': (p) => <SockPair {...p} />,
  'cup-shuffle': (p) => <CupShuffle {...p} />,
  'curtain': (p) => <Curtain {...p} />,
  'hammer-nails': (p) => <HammerNails {...p} />,
  'blow-pinwheel': (p) => <BlowPinwheel {...p} />,
  'blow-balloon': (p) => <BlowBalloon {...p} />,
  'blow-bubbles': (p) => <BlowBubbles {...p} />,
  'blow-boat': (p) => <BlowBoat {...p} />,
  // Nhóm trò 3 tuổi — Toán sớm, Ngôn ngữ, Cảm xúc (features/early)
  'share-treats': (p) => <ShareTreats {...p} />,
  'balance-scale': (p) => <BalanceScale {...p} />,
  'count-touch': (p) => <CountTouch {...p} />,
  'where-bear': (p) => <WhereBear {...p} />,
  'opposites': (p) => <Opposites {...p} />,
  'how-feel': (p) => <HowFeel {...p} />,
};

export const GAMES: GameEntry[] = GAME_META.map((m) => ({ ...m, render: RENDERS[m.id] }));

export const gameById = (id: string) => GAMES.find((g) => g.id === id);
export const gameRoute = (g: GameEntry): Route => g.route ?? { name: 'play', game: g.id, arg: g.arg };
