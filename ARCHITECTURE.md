# Gấu Học Vui — Kiến trúc

App học sớm cho trẻ 1–6 tuổi, học mà chơi, chạy trên trình duyệt (tablet/điện thoại, màn hình ngang).
Stack: Vite + React 18 + TypeScript + Tailwind CSS 4 + Zustand + Motion. Âm thanh: Web Speech API + Web Audio API.

## Nguyên tắc

- **Nội dung tách khỏi giao diện.** Một `VocabItem` khai báo 1 lần trong `src/data/`, dùng lại cho Tráo thẻ, Nhận biết, Nghe & Tìm, Tìm bóng, Lật thẻ…
- **Một cách vẽ cho mỗi loại hình.** `CardVisual` vẽ mọi kiểu `Visual` (emoji, chữ, chấm, hình, đồng hồ, màu, ảnh). Thêm loại mới = thêm 1 nhánh.
- **Một bộ nút chung.** `PressButton`, `Segmented`, `Modal`, `TopBar` dùng ở mọi màn hình để giao diện đồng bộ.
- **Module chưa làm vẫn có chỗ.** `data/curriculum.ts` liệt kê cả 9 module, cái chưa làm có `status: 'planned'`.

## Thư mục

```
src/
├─ main.tsx                     điểm vào
├─ app/App.tsx                  khung app, chọn màn hình theo route
├─ store/                       trạng thái (Zustand, lưu localStorage)
│  ├─ useNav.ts                 route hiện tại
│  ├─ useFlashcardStore.ts      cài đặt tráo thẻ + chủ đề đã chọn
│  ├─ useSettingsStore.ts       cài đặt của bố mẹ: âm lượng giọng/nhạc, giới hạn phút/ngày, gói giọng
│  └─ useProgressStore.ts       sao, số lần xem, kết quả mini-game, nhật ký theo ngày, thống kê từng bài
├─ types/                       kiểu dữ liệu (đọc ở mục Schema)
│  ├─ content.ts  settings.ts  curriculum.ts  progress.ts
├─ data/
│  ├─ index.ts                  TOPICS, getTopic, spokenText
│  ├─ curriculum.ts             3 phân hệ, 9 module
│  ├─ build.ts                  hàm tạo thẻ nhanh
│  └─ topics/                   từng nhóm chủ đề (thêm file mới tại đây)
├─ services/audio/
│  ├─ AudioManager.ts           1 AudioContext chung, giải mã sẵn, phát/dừng tức thì
│  ├─ voicePack.ts              chọn gói giọng (bo/me/máy), đọc manifest, tìm câu
│  ├─ voice.ts                  say()/preloadVoice(): gói giọng → giọng máy (dự phòng), karaoke onWord, isSpeaking()
│  ├─ sfx.ts                    Ting, Èo, Bụp, Xoẹt, vỗ tay, 8 nốt Đô→Đố (Web Audio)
│  └─ music.ts                  nhạc nền ru nhẹ tự sinh (ngũ cung), tự hạ khi cô đọc
├─ components/
│  ├─ ui/                       PressButton, TopBar, Modal, Segmented, RotateHint
│  └─ content/                  CardVisual, BearMascot
├─ features/
│  ├─ dashboard/                màn hình chính
│  ├─ flashcards/               Tráo thẻ: Home, Settings, Player (tải trước + đếm ngược), buildDeck
│  ├─ stories/                  Truyện thơ tiềm thức: thư viện + trình đọc karaoke
│  ├─ discovery/                Nhận biết: chọn chủ đề → bài 3 từ → kính lúp
│  └─ language/                 Ngôn ngữ: hub, Nghe & Tìm, Đại dương/Rừng rậm (SceneHunt), Dán hình
├─ components/game/             dùng chung mọi trò:
│     ChoiceGame (khung "hỏi → chọn"), useGameSession + GameScreen (lượt, sao, kết quả),
│     useDragDrop (kéo thả cảm ứng), TraceCanvas (tô theo nét), ChoiceCard, ResultModal, TopicPicker
├─ features/registry.tsx        nối id trò chơi → component; data/gameList.ts là danh sách trò (dữ liệu)
├─ features/hub/GameHub.tsx     màn hình module, tự liệt kê trò từ danh sách
├─ features/cognitive/          Tìm bóng, Đếm vật ẩn, Làm theo mẫu, Xếp tháp, Xoay hình, Xỏ chỉ, Mặc áo, Lật thẻ
├─ features/art/                Tô hình theo nét, Tô màu tranh, Vẽ tự do, Bộ sưu tập (IndexedDB)
├─ features/music/              Đàn piano, Kéo nốt nhạc (+ Tiếng gì đây? trong cognitive/choiceGames)
├─ features/math/               Làm quen số 0–9 (3 bước), So sánh; Đếm trứng, Số thiếu, Chậu hoa ở choiceGames
├─ features/talking/            Gấu biết nói: nhại giọng (services/audio/voiceChanger.ts, chỉ giữ trong bộ nhớ), chạm phản ứng, chăm sóc;
│                               nhân vật gấu dùng chung: components/content/BearCharacter.tsx (DancingBear = tư thế 'dance')
├─ features/focus/              Trò rèn tập trung cho bé 2 tuổi: Tìm đôi (PairItem vẽ tất/găng/giày SVG), Úp cốc, Kéo rèm, Đóng đinh
├─ features/montessori/         Trò kéo thả cho bé 2 tuổi: Phân loại màu, To và nhỏ, Mẹ và con (dữ liệu: data/montessori.ts)
├─ features/parent/             Góc phụ huynh: ParentGate (ổ khóa + phép nhân bằng chữ), ParentCorner (báo cáo, cài đặt),
│                               AppSession (áp cài đặt âm thanh, đếm phút chơi, tắt nhạc ở trò âm nhạc), Bedtime (hết giờ)
├─ services/audio/feedback.ts   khen/nhắc chuẩn: Ting + "Đúng rồi!", Èo + "Thử lại nhé!"
├─ data/games.ts                chủ đề có hình, chia bài 3 từ, định nghĩa cảnh
├─ data/phrases.ts              mọi câu cô giáo nói (để thu sẵn)
├─ data/stories.ts              thơ, đồng dao, truyện
scripts/
├─ collect-texts.ts             gom câu cần thu → voice-texts.json
├─ build_voice_pack.py          OmniVoice/Piper đọc → public/audio/[<pack>/]*.mp3 + manifest.json
└─ build_emoji_images.py        emoji đang dùng → public/emoji/*.webp + src/data/emojiIndex.ts
public/audio/                   gói giọng bố (bố cục cũ, ở thẳng gốc); gói khác ở public/audio/<pack>/
public/emoji/                   hình 3D Fluent Emoji 256px (~2 MB)
└─ styles/index.css             bảng màu, font, lớp dùng chung
```

Các giai đoạn sau thêm thư mục trong `features/`:

| Giai đoạn | Thư mục | Mini-game (`MiniGameConfig.type`) |
|---|---|---|
| 2 | `discovery/`, `language-games/` | `magnifier`, `listen-find`, `sticker`, `story-player` |
| 3 | `observation/`, `fine-motor/`, `memory/` | `shadow-match`, `hidden-count`, `sequence`, `color-tower`, `rotate-grid`, `thread-needle`, `memory` |
| 4 | `art/`, `music/`, `math/` | `trace`, `coloring`, `sound-quiz`, `piano-drag`, `number-intro`, `count-pick`, `missing-number`, `compare` |

## Schema chính

- `Topic { id, title: {vi,en}, group, langs?, items: VocabItem[] }`
- `VocabItem { id, label: {vi,en}, speak?, visual: Visual, audio? }`
- `Visual` = `emoji | glyph | dots | shape | clock | color | image`
- `Story { id, kind: poem|rhyme|story, title, lang, cover, lines[] }`
- `FlashcardSettings { lang, face: image|text|both, order: shuffle|fixed, mode: auto|manual, intervalMs, cardsPerTopic 5–10, speak }`
- `ModuleDef { id, subject, title, icon, color, phase, status }`
- `DiscoveryLesson { topicId, targetIds: [3 từ] }`
- `MiniGameConfig` = union theo `type`, mỗi loại có trường riêng + `level: easy|medium|hard`
- `ProgressState { childName, stars, flashcardViews, gameResults, daily: {YYYY-MM-DD: {plays, seconds, stars}}, gameStats: {id: {plays, correct, total}} }`
  (`addStars` đếm 1 lượt/ngày; `recordGame(id, sao, {correct, total})` cộng thống kê; `addPlayTime` do AppSession gọi 15 giây/lần)
- `AppSettings { voiceVolume, musicOn, musicVolume, dailyLimitMin (0 = không giới hạn), voice: 'bo'|'me'|'may' }`

## Thêm một chủ đề

1. Tạo/sửa file trong `src/data/topics/`, ví dụ:
   ```ts
   { id: 'jobs', group: 'objects', title: { vi: 'Nghề nghiệp', en: 'Jobs' },
     items: emojiItems('jobs', `👨‍⚕️|Bác sĩ|Doctor; 👩‍🍳|Đầu bếp|Chef`) }
   ```
2. Nối mảng vào `TOPICS` trong `src/data/index.ts`. Xong, Tráo thẻ tự hiện chủ đề mới.

## Giọng đọc

Gói giọng thu sẵn bằng **Piper** (giọng `vi_VN-vais1000-medium`, chạy offline, miễn phí).
Mỗi chủ đề / bài thơ là 1 file mp3; `manifest.json` ghi câu nào ở giây thứ mấy, thơ có thêm mốc từng chữ.
App gọi `say("Con mèo")`: có trong gói → phát ngay từ bộ nhớ; không có → giọng của máy.

Thêm/sửa nội dung thì tạo lại gói (trên PC, cần Python + ffmpeg):

```
pip install piper-tts
# tải giọng (1 lần): https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-vi_VN-vais1000-medium.tar.bz2
npm run voice:texts
python scripts/build_voice_pack.py --model đường/dẫn/vi_VN-vais1000-medium.onnx
```
Tốc độ đọc: `--length-scale` (thẻ, mặc định 1.2) và `--story-length-scale` (thơ, 1.7); số lớn hơn là chậm hơn.

## Thêm một trò chơi

1. Viết component nhận `GameProps` (`onExit`, `arg`), dùng `ChoiceGame` hoặc `useGameSession` + `GameScreen`.
2. Thêm 1 dòng vào `src/data/gameList.ts` và 1 dòng vào `RENDERS` trong `src/features/registry.tsx`.
3. Câu cô đọc mới thì thêm vào `src/data/phrases.ts`, rồi tạo lại gói giọng.

## Giọng OmniVoice (hay hơn Piper)

`scripts/build_voice_pack.py --engine omnivoice` dùng mô hình OmniVoice (k2-fsa, Apache-2.0), cần card đồ họa.
Cách dễ nhất: mở `tools/gau_giong_omnivoice.ipynb` trên Google Colab (GPU T4 miễn phí), chạy lần lượt các ô,
tải về `gau-voice-pack.zip`, giải nén đè vào `public/audio/`.
Giữ một giọng cho cả app: sao chép từ ghi âm 5–10 giây (`--ref-audio`), hoặc thiết kế 1 lần (`--instruct`)
rồi sao chép lại. Câu đã đọc lưu ở `.voice-cache/`, bị ngắt chạy lại sẽ làm tiếp.

## Nhiều gói giọng (Bố / Mẹ / Giọng máy)

Chọn trong Góc phụ huynh (ổ khóa góc phải trang chủ → trả lời phép nhân). `voicePack.ts` tìm manifest:

| Giọng | Tìm ở (theo thứ tự) |
|---|---|
| `bo` | `public/audio/bo/manifest.json`, rồi `public/audio/manifest.json` (gói hiện tại) |
| `me` | `public/audio/me/manifest.json` — chưa có thì ô "Mẹ" bị mờ, ghi "chưa có — cần ghi âm của mẹ" |
| `may` | không dùng gói, đọc bằng Web Speech |

Sprite trong manifest ghi đường dẫn từ gốc web (`audio/x.mp3`, `audio/me/x.mp3`); tên trần (`x.mp3`) thì tính
theo thư mục chứa manifest. Tạo gói mẹ:

```
python scripts/build_voice_pack.py --pack me --ref-audio me.wav --ref-text "lời đọc đúng trong ghi âm"
```
`--pack` ghi vào `public/audio/<pack>/` và dùng bộ đệm riêng `.voice-cache/<pack>/` (không lẫn giọng mẫu của bố).
`--out-dir` (= `--out`) và `--cache` vẫn chỉnh tay được.

## Nhạc nền, giờ chơi

- Nhạc nền (`music.ts`) phát qua kênh riêng của `AudioManager` (`musicOut`), mặc định bật ở 35%, hạ còn 1/4 khi
  `isSpeaking()` (có đoạn giọng đang phát, giọng máy đang nói, hoặc file thu riêng đang chạy), tắt trong các trò module `music`.
- Giới hạn phút/ngày: hết giờ thì về trang chủ và phủ màn "Gấu đi ngủ rồi" (đọc `PHRASES.bedtime`);
  bố mẹ mở ổ khóa trên màn đó để đổi giới hạn.

## Đổi sang giọng đọc khác

Mọi giọng nằm trong `public/audio/` (file mp3 + manifest.json). Chỉ cần thay `scripts/build_voice_pack.py`
bằng dịch vụ/giọng khác mà vẫn xuất cùng định dạng manifest, app không phải sửa gì.

## Hình emoji 3D

Emoji hiện bằng hình 3D Microsoft Fluent Emoji (giấy phép MIT, xem `public/emoji/LICENSE-fluent-emoji.txt`) cho đẹp và giống nhau trên mọi máy.
`<Emoji glyph="🐶" />` (`components/content/Emoji.tsx`) hiện `emoji/<mã>.webp` nếu có trong `EMOJI_IMAGES`, không thì dùng chữ emoji gốc;
cỡ hình = 1em nên chỉ cần đặt font-size như cũ. `CardVisual` (kind `emoji`) đã dùng sẵn. Thêm emoji mới vào `src/` rồi chạy lại
`python scripts/build_emoji_images.py` (cần Pillow) để tải thêm hình.

Hình emoji: Microsoft Fluent Emoji (MIT).

## Lệnh

```
npm install
npm run dev          # chạy thử trên máy, mở http://localhost:5173
npm run build        # bản web để đưa lên hosting (thư mục dist/)
SINGLE=1 npx vite build --outDir dist-single   # gộp thành 1 file HTML
```

## Giới hạn đã biết

- Trình duyệt không cho web khóa xoay màn hình. App nhắc xoay ngang khi máy đang dọc.
- Gói giọng chỉ có Tiếng Việt; chế độ Tiếng Anh dùng giọng của máy. Đổi tên bé khác "Gấu" thì câu chào dùng giọng máy cho tới khi tạo lại gói.
- Mốc từng chữ của karaoke là ước lượng (Piper không xuất mốc thời gian), đủ khớp cho trẻ nhỏ nhưng có thể lệch một chút ở câu dài.
- Emoji nhỏ trong chữ (nút, nhãn) vẫn là emoji của máy; vài ký hiệu (→ ✓ ✕) không có trong Fluent Emoji nên giữ nguyên. Trường `visual.kind: 'image'` đã sẵn để thay bằng ảnh vẽ riêng.
