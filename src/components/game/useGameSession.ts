import { useRef, useState } from 'react';
import { useProgressStore } from '@/store/useProgressStore';
import { feedbackDone } from '@/services/audio/feedback';
import { starsFor } from './ResultModal';

/**
 * Quản lý một phiên chơi nhiều lượt cho các trò tự vẽ giao diện (kéo thả, xếp hình…):
 * đếm lượt đúng ngay lần đầu, chuyển lượt, chấm sao, lưu kết quả.
 */
export function useGameSession({ resultId, rounds }: { resultId: string; rounds: number }) {
  const { childName, addStars, recordGame } = useProgressStore();
  const [round, setRound] = useState(0);
  const [game, setGame] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState<1 | 2 | 3>(3);
  const firstTry = useRef(0);
  const missed = useRef(false);

  /** Bé làm sai trong lượt này. */
  const miss = () => { missed.current = true; };

  /** Bé hoàn thành lượt. Gọi sau khi đã khen xong. */
  const win = () => {
    if (!missed.current) firstTry.current++;
    missed.current = false;
    if (round + 1 < rounds) { setRound(round + 1); return; }
    const s = starsFor(firstTry.current, rounds);
    setStars(s);
    setDone(true);
    recordGame(resultId, s, { correct: firstTry.current, total: rounds });
    addStars(s);
    feedbackDone(childName);
  };

  const again = () => { firstTry.current = 0; missed.current = false; setRound(0); setDone(false); setGame((g) => g + 1); };

  return { round, game, done, stars, miss, win, again, childName };
}
