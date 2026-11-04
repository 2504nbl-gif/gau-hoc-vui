import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/index.css';
import { unlockAudio } from './services/audio/AudioManager';

// Mở khóa âm thanh ngay lần chạm đầu tiên (yêu cầu của trình duyệt).
window.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
