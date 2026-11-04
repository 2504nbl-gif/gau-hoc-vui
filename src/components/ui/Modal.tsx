import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface Props {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  width?: string;
}

export function Modal({ open, onClose, children, width = 'min(560px, 100%)' }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 grid place-items-center bg-ink/45 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            style={{ width }}
            className="max-h-[92%] overflow-auto rounded-[28px] bg-paper p-5 shadow-xl"
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
