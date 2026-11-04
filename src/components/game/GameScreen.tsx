import type { CSSProperties, ReactNode } from 'react';
import { TopBar } from '@/components/ui/TopBar';
import { RoundDots } from './RoundDots';
import { ResultModal } from './ResultModal';
import { stopVoice } from '@/services/audio/voice';
import type { useGameSession } from './useGameSession';

/** Khung màn hình chung cho trò chơi: thanh trên, chấm lượt, nút nghe lại, kết quả. */
export function GameScreen({
  title, color, session, rounds, onExit, onReplay, children, message,
}: {
  title: string;
  color: string;
  session: ReturnType<typeof useGameSession>;
  rounds: number;
  onExit: () => void;
  onReplay?: () => void;
  children: ReactNode;
  message?: string;
}) {
  return (
    <main className="room" style={{ '--c': `var(--color-${color})` } as CSSProperties}>
      <TopBar title={title} onBack={() => { stopVoice(); onExit(); }}
        right={<>
          {rounds > 1 && <RoundDots total={rounds} current={session.round} />}
          {onReplay && <button aria-label="Nghe lại" onClick={onReplay} className="press h-11 rounded-2xl px-4 font-extrabold">🔊</button>}
        </>} />
      {children}
      <ResultModal open={session.done} stars={session.stars} message={message ?? `${session.childName} làm xong rồi`}
        onAgain={session.again} onExit={onExit} />
    </main>
  );
}
