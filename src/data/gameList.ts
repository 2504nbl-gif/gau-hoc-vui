// Danh sách trò chơi (chỉ dữ liệu, không có giao diện) — dùng cho màn hình module và công cụ tạo gói giọng.
import type { ModuleId } from '@/types/curriculum';
import type { Route } from '@/store/useNav';

export interface GameMeta {
  id: string;
  module: ModuleId;
  title: string;
  icon: string;
  note: string;
  color: string;
  /** Trò có màn hình riêng (đã có route); bỏ trống = chạy trong route chung { name: 'play' }. */
  route?: Route;
  arg?: string;
}

export const GAME_META: GameMeta[] = [
  // Ngôn ngữ
  { id: 'stories', module: 'language-games', title: 'Truyện thơ tiềm thức', icon: '📖', note: 'Nghe cô đọc thơ, ca dao, truyện', color: 'grape', route: { name: 'stories' } },
  { id: 'listen-find', module: 'language-games', title: 'Nghe và tìm', icon: '👂', note: 'Nghe tên, chạm đúng hình', color: 'coral', route: { name: 'listen-find' } },
  { id: 'ocean', module: 'language-games', title: 'Đại dương', icon: '🌊', note: 'Tìm các bạn dưới biển', color: 'sea', route: { name: 'scene-hunt', scene: 'ocean' } },
  { id: 'jungle', module: 'language-games', title: 'Rừng rậm', icon: '🌴', note: 'Tìm các bạn trong rừng', color: 'leaf', route: { name: 'scene-hunt', scene: 'jungle' } },
  { id: 'sticker', module: 'language-games', title: 'Dán hình', icon: '🧩', note: 'Kéo hình dán vào tranh', color: 'sun', route: { name: 'sticker' } },
  { id: 'mom-baby', module: 'language-games', title: 'Mẹ và con', icon: '🐥', note: 'Đưa con về với mẹ', color: 'peach' },
  { id: 'curtain', module: 'language-games', title: 'Kéo rèm', icon: '🖼️', note: 'Kéo rèm ra, xem hình gì', color: 'coral' },
  // Tư duy — Quan sát
  { id: 'shadow-match', module: 'observation', title: 'Tìm bóng', icon: '🌑', note: 'Kéo bạn về đúng cái bóng', color: 'teal' },
  { id: 'hidden-count', module: 'observation', title: 'Đếm vật ẩn', icon: '🌿', note: 'Đếm cả những bạn nấp sau lá', color: 'leaf' },
  { id: 'sequence', module: 'observation', title: 'Làm theo mẫu', icon: '🥪', note: 'Làm bánh mì, làm kem giống mẫu', color: 'peach' },
  { id: 'color-tower', module: 'observation', title: 'Xếp tháp màu', icon: '🗼', note: 'Vòng to xếp dưới, nhỏ dần lên', color: 'coral' },
  { id: 'rotate-grid', module: 'observation', title: 'Xoay hình', icon: '🔄', note: 'Chạm xoay 4 mảnh cho đúng', color: 'sea' },
  { id: 'color-sort', module: 'observation', title: 'Phân loại màu', icon: '🍎', note: 'Bỏ đồ vật vào giỏ cùng màu', color: 'berry' },
  { id: 'sock-pair', module: 'observation', title: 'Tìm đôi', icon: '🧦', note: 'Ghép chiếc tất, găng, giày giống hệt', color: 'berry' },
  // Tư duy — Vận động tinh
  { id: 'thread-needle', module: 'fine-motor', title: 'Xỏ chỉ qua kim', icon: '🪡', note: 'Kéo sợi chỉ theo đường chấm', color: 'peach' },
  { id: 'dress-up', module: 'fine-motor', title: 'Mặc áo cho gấu', icon: '👕', note: 'Kéo mũ, áo, quần, giày', color: 'grape' },
  { id: 'hammer-nails', module: 'fine-motor', title: 'Đóng đinh', icon: '🔨', note: 'Chạm đinh, búa gõ cốc cốc', color: 'peach' },
  // Vận động tinh — Tập thổi (luyện hơi thở, cơ miệng; thổi vào micro hoặc giữ nút gió)
  { id: 'blow-pinwheel', module: 'fine-motor', title: 'Thổi chong chóng', icon: '🌬️', note: 'Tập thổi: chong chóng quay tít', color: 'sky' },
  { id: 'blow-balloon', module: 'fine-motor', title: 'Thổi bóng bay', icon: '🎈', note: 'Tập thổi: bóng to dần rồi nổ', color: 'coral' },
  { id: 'blow-bubbles', module: 'fine-motor', title: 'Thổi bong bóng', icon: '🫧', note: 'Tập thổi, chạm cho bóng nổ', color: 'grape' },
  { id: 'blow-boat', module: 'fine-motor', title: 'Thổi thuyền giấy', icon: '⛵', note: 'Tập thổi: thuyền sang bờ', color: 'sea' },
  // Thực hành cuộc sống + Giác quan (Montessori, bé 3 tuổi) — features/practical
  { id: 'pour-water', module: 'fine-motor', title: 'Rót nước', icon: '🥛', note: 'Giữ bình, rót tới đúng vạch', color: 'sky' },
  { id: 'fasten', module: 'fine-motor', title: 'Cài cúc, kéo khóa', icon: '🧥', note: 'Kéo cúc vào khuyết, kéo khóa lên', color: 'sea' },
  { id: 'water-plants', module: 'fine-motor', title: 'Tưới cây', icon: '🌷', note: 'Tưới cây héo cho nở hoa', color: 'leaf' },
  { id: 'size-order', module: 'observation', title: 'Xếp từ to đến nhỏ', icon: '🐻', note: 'Xếp theo thứ tự to dần, nhỏ dần', color: 'coral' },
  { id: 'tidy-up', module: 'observation', title: 'Dọn đồ đúng chỗ', icon: '🧸', note: 'Đồ chơi, quần áo, đồ ăn về đúng nơi', color: 'teal' },
  { id: 'half-match', module: 'observation', title: 'Ghép nửa hình', icon: '🦋', note: 'Tìm nửa còn lại của hình', color: 'grape' },
  // Tư duy — Ghi nhớ
  { id: 'memory-2x2', module: 'memory', title: 'Lật thẻ dễ', icon: '🃏', note: '2 × 2 · 2 cặp', color: 'leaf', arg: '2x2' },
  { id: 'memory-2x3', module: 'memory', title: 'Lật thẻ vừa', icon: '🎴', note: '2 × 3 · 3 cặp', color: 'sun', arg: '2x3' },
  { id: 'memory-3x4', module: 'memory', title: 'Lật thẻ khó', icon: '🧠', note: '3 × 4 · 6 cặp', color: 'berry', arg: '3x4' },
  { id: 'cup-shuffle', module: 'memory', title: 'Úp cốc', icon: '🥤', note: 'Đồ chơi trốn trong cốc nào?', color: 'grape' },
  // Mỹ thuật
  { id: 'trace-shapes', module: 'art', title: 'Tô hình theo nét', icon: '✏️', note: 'Tròn, vuông, tam giác, ngôi sao…', color: 'berry' },
  { id: 'coloring', module: 'art', title: 'Tô màu tranh', icon: '🖍️', note: 'Chọn màu, chạm để tô', color: 'sun' },
  { id: 'free-draw', module: 'art', title: 'Vẽ tự do', icon: '🎨', note: 'Bảng vẽ của bé', color: 'sea' },
  { id: 'gallery', module: 'art', title: 'Bộ sưu tập', icon: '🖼️', note: 'Tranh bé đã lưu', color: 'grape' },
  // Âm nhạc
  { id: 'piano', module: 'music', title: 'Đàn piano', icon: '🎹', note: 'Chơi tự do hoặc theo bài', color: 'sky' },
  { id: 'piano-drag', module: 'music', title: 'Kéo nốt nhạc', icon: '🎵', note: 'Đặt nốt lên đúng phím', color: 'grape' },
  { id: 'sound-quiz', module: 'music', title: 'Tiếng gì đây?', icon: '👂', note: 'Nghe âm thanh, chọn hình', color: 'coral' },
  // Toán
  { id: 'number-lesson', module: 'math', title: 'Làm quen chữ số', icon: '🔢', note: 'Số 0–9: xem, viết, luyện', color: 'sun' },
  { id: 'egg-count', module: 'math', title: 'Đếm trứng', icon: '🥚', note: 'Có bao nhiêu quả trứng?', color: 'peach' },
  { id: 'missing-number', module: 'math', title: 'Số còn thiếu', icon: '❓', note: 'Điền số vào dãy', color: 'sea' },
  { id: 'flower-pot', module: 'math', title: 'Chọn chậu hoa', icon: '🌷', note: 'Chậu có đúng số bông hoa', color: 'leaf' },
  { id: 'compare', module: 'math', title: 'So sánh', icon: '⚖️', note: 'Kéo dấu lớn, bé, bằng', color: 'grape' },
  { id: 'big-small', module: 'math', title: 'To và nhỏ', icon: '🐘', note: 'Con to về nhà to, con nhỏ về nhà nhỏ', color: 'sun' },
  // Phát triển tư duy cho bé 3 tuổi (features/logic)
  { id: 'odd-one-out', module: 'observation', title: 'Tìm bạn khác loại', icon: '🔍', note: 'Bạn nào khác các bạn còn lại?', color: 'teal' },
  { id: 'pattern-next', module: 'observation', title: 'Hình gì tiếp theo?', icon: '🪆', note: 'Đỏ, xanh, đỏ, xanh… rồi đến gì?', color: 'grape' },
  { id: 'jigsaw', module: 'observation', title: 'Xếp hình 4 mảnh', icon: '🧩', note: 'Kéo mảnh ghép vào đúng chỗ', color: 'sun' },
  { id: 'maze', module: 'fine-motor', title: 'Mê cung', icon: '🍯', note: 'Đưa gấu đi tới hũ mật ong', color: 'leaf' },
  { id: 'whats-missing', module: 'memory', title: 'Thiếu bạn nào?', icon: '👀', note: 'Nhìn kỹ, bạn nào trốn mất?', color: 'coral' },
  { id: 'story-order', module: 'language-games', title: 'Chuyện gì trước, chuyện gì sau?', icon: '🌻', note: 'Xếp 3 tranh theo thứ tự 1-2-3', color: 'leaf' },
];
