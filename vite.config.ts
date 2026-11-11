import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// SINGLE=1 gộp toàn bộ app vào 1 file HTML (để đăng làm Artifact).
// Bản thường (npm run build) là app cài được (PWA): toàn màn hình, khóa ngang, chạy offline.
const single = Boolean(process.env.SINGLE);

const pwa = VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'script',
  includeAssets: ['icons/icon.svg'],
  manifest: {
    name: 'Gấu Học Vui',
    short_name: 'Gấu Học Vui',
    description: 'Học mà chơi cho bé: tráo thẻ, nhận biết, thơ, toán, âm nhạc, mỹ thuật.',
    lang: 'vi',
    start_url: './',
    scope: './',
    display: 'fullscreen',
    orientation: 'landscape',
    background_color: '#f3fbff',
    theme_color: '#4db463',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    // Tải sẵn toàn bộ app + gói giọng để dùng khi không có mạng.
    globPatterns: ['**/*.{js,css,html,png,svg,json,mp3,webp}'],
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
    navigateFallback: 'index.html',
    // Thư mục app khác nằm chung trang (vd /co-vua) không được trả về app Gấu
    navigateFallbackDenylist: [/\/co-vua(\/|$)/],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
        handler: 'CacheFirst',
        options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
      },
    ],
  },
});

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile()] : [pwa])],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
