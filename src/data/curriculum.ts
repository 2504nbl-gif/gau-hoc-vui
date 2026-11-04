import type { ModuleDef, Subject } from '@/types/curriculum';

export const SUBJECTS: Subject[] = [
  { id: 'language', title: 'Ngôn ngữ', modules: ['flashcards', 'discovery', 'language-games'] },
  { id: 'cognitive', title: 'Tư duy', modules: ['observation', 'fine-motor', 'memory'] },
  { id: 'art-math', title: 'Nghệ thuật & Toán', modules: ['art', 'music', 'math'] },
];

/** Thứ tự ở đây là thứ tự ô trên màn hình chính. */
export const MODULES: ModuleDef[] = [
  { id: 'flashcards', subject: 'language', title: 'Tráo thẻ', icon: '🃏', color: 'coral', phase: 1, status: 'ready' },
  { id: 'discovery', subject: 'language', title: 'Nhận biết', icon: '🔍', color: 'leaf', phase: 2, status: 'ready' },
  { id: 'language-games', subject: 'language', title: 'Ngôn ngữ', icon: '📖', color: 'sea', phase: 2, status: 'ready' },
  { id: 'observation', subject: 'cognitive', title: 'Quan sát', icon: '👀', color: 'teal', phase: 3, status: 'ready' },
  { id: 'fine-motor', subject: 'cognitive', title: 'Vận động tinh', icon: '🧵', color: 'peach', phase: 3, status: 'ready' },
  { id: 'memory', subject: 'cognitive', title: 'Ghi nhớ', icon: '🧠', color: 'grape', phase: 3, status: 'ready' },
  { id: 'math', subject: 'art-math', title: 'Toán học', icon: '🔢', color: 'sun', phase: 4, status: 'ready' },
  { id: 'music', subject: 'art-math', title: 'Âm nhạc', icon: '🎹', color: 'sky', phase: 4, status: 'ready' },
  { id: 'art', subject: 'art-math', title: 'Mỹ thuật', icon: '🎨', color: 'berry', phase: 4, status: 'ready' },
];
