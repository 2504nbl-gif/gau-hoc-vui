// Phản hồi chuẩn cho mọi trò chơi: cùng một kiểu khen, một kiểu nhắc, ở mọi màn hình.
import { PHRASES } from '@/data/phrases';
import { sfx } from './sfx';
import { burst } from '@/components/game/Fireworks';
import { say, sayAll, type Playback } from './voice';

/** Bé chọn đúng: "Ting!" + "Đúng rồi! Con mèo". */
export function feedbackCorrect(name?: string): Playback {
  sfx.correct();
  burst();
  return sayAll(name ? [PHRASES.correct, name] : [PHRASES.correct]);
}

/** Bé chọn sai: "Èo…" + nói tên hình bé vừa chạm (học thêm được một từ), rồi nhắc thử lại. */
export function feedbackWrong(touchedName?: string): Playback {
  sfx.wrong();
  return touchedName ? sayAll([touchedName, PHRASES.tryAgain]) : say(PHRASES.tryAgain);
}

/** Hết bài: nhạc + vỗ tay + lời khen. */
export function feedbackDone(childName: string) {
  sfx.success();
  sfx.applause();
  window.setTimeout(() => say(PHRASES.gameDone(childName)), 600);
}
