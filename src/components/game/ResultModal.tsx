import { Modal } from '@/components/ui/Modal';
import { PressButton } from '@/components/ui/PressButton';
import { BearMascot } from '@/components/content/BearMascot';
import { Emoji } from '@/components/content/Emoji';

/** Màn hình "Giỏi quá!" cuối mỗi bài — dùng chung mọi module. */
export function ResultModal({
  open, message, stars = 3, onAgain, onExit, againLabel = 'Chơi lại', exitLabel = 'Quay lại',
}: {
  open: boolean;
  message: string;
  stars?: 1 | 2 | 3;
  onAgain: () => void;
  onExit: () => void;
  againLabel?: string;
  exitLabel?: string;
}) {
  return (
    <Modal open={open} width="min(440px, 100%)">
      <div className="flex flex-col items-center gap-2 text-center">
        <BearMascot className="w-28" />
        <h2 className="m-0 font-display text-4xl font-extrabold text-leaf">Giỏi quá!</h2>
        <div className="text-4xl tracking-widest" aria-label={`${stars} sao`}>
          {[0, 1, 2].map((i) => <Emoji key={i} glyph="⭐" className={i < stars ? '' : 'opacity-25'} />)}
        </div>
        <p className="m-0 font-bold text-soft">{message}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <PressButton color="leaf" onClick={onAgain}>{againLabel}</PressButton>
          <PressButton variant="ghost" onClick={onExit}>{exitLabel}</PressButton>
        </div>
      </div>
    </Modal>
  );
}

/** Đổi số câu đúng ngay lần đầu thành 1–3 sao. */
export const starsFor = (firstTry: number, total: number): 1 | 2 | 3 =>
  firstTry >= total ? 3 : firstTry >= Math.ceil(total / 2) ? 2 : 1;
