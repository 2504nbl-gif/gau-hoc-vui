import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PressButton } from '@/components/ui/PressButton';
import { NUMBER_WORDS } from '@/data/phrases';
import { useNav } from '@/store/useNav';

const newQuestion = () => {
  const a = 3 + Math.floor(Math.random() * 7); // 3–9
  const b = 3 + Math.floor(Math.random() * 7);
  return { text: `${NUMBER_WORDS[a]} nhân ${NUMBER_WORDS[b].toLowerCase()} bằng bao nhiêu?`, answer: a * b };
};

/**
 * Ổ khóa nhỏ ở góc màn hình → bài kiểm tra người lớn (phép nhân viết bằng chữ, gõ số)
 * → Góc phụ huynh. Bé 2 tuổi chưa đọc được nên không tự vào được.
 */
export function ParentGate() {
  const go = useNav((s) => s.go);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(newQuestion);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  const show = () => { setQ(newQuestion()); setValue(''); setWrong(false); setOpen(true); };
  const submit = () => {
    if (Number(value) === q.answer) { setOpen(false); go({ name: 'parent' }); return; }
    setWrong(true);
    setValue('');
    setQ(newQuestion());
  };

  return (
    <>
      <button
        aria-label="Góc phụ huynh"
        onClick={show}
        className="fixed z-30 grid size-10 place-items-center rounded-full text-lg opacity-35 transition-opacity hover:opacity-70"
        style={{ top: 'calc(8px + env(safe-area-inset-top, 0px))', right: 'max(8px, env(safe-area-inset-right, 0px))' }}
      >
        🔒
      </button>
      <Modal open={open} onClose={() => setOpen(false)} width="min(420px, 100%)">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => { e.preventDefault(); submit(); }}
        >
          <h2 className="m-0 font-display text-2xl font-extrabold">Dành cho bố mẹ</h2>
          <p className="m-0 font-bold text-soft">Trả lời câu hỏi để vào Góc phụ huynh.</p>
          <label className="flex flex-col gap-2 font-extrabold">
            {q.text}
            <input
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
              value={value}
              onChange={(e) => { setValue(e.target.value.replace(/\D/g, '')); setWrong(false); }}
              className="h-12 rounded-xl border-2 border-line bg-cloud px-4 text-xl font-extrabold outline-none focus:border-sea"
            />
          </label>
          {wrong && <p role="alert" className="m-0 font-bold text-coral">Chưa đúng, thử câu khác nhé.</p>}
          <div className="flex justify-end gap-3">
            <PressButton type="button" variant="ghost" onClick={() => setOpen(false)}>Đóng</PressButton>
            <PressButton type="submit" color="sea" disabled={!value}>Vào</PressButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
