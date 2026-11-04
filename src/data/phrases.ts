// Mọi câu cô giáo nói trong app. Đặt ở một chỗ để công cụ tạo gói giọng
// (scripts/collect-texts.ts) đọc được và thu sẵn thành âm thanh.
// Câu nào không có trong gói giọng sẽ được đọc bằng giọng của máy.
// Câu ghép (vd "Bé tìm" + "Con mèo") được phát nối tiếp bằng sayAll(), nên chỉ cần thu từng mảnh.

import { MONTESSORI_NAMES } from './montessori';

export const DEFAULT_CHILD = 'Gấu';

/** "Một", "Hai"… (0–10) để ghép câu đếm số. */
export const NUMBER_WORDS = ['Không', 'Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười'];

export const PHRASES = {
  greet: (name: string) => `Chào ${name}! Hôm nay mình học gì nhỉ?`,
  comingSoon: (module: string, name: string) => `${module} sắp có rồi, ${name} đợi nhé!`,
  preparing: 'Cô giáo đang chuẩn bị thẻ cho con nhé.',
  countdown: ['Ba', 'Hai', 'Một', 'Bắt đầu nào!'],
  maxTopics: (n: number) => `Chọn tối đa ${n} chủ đề thôi nhé`,
  done: (name: string) => `Giỏi quá! ${name} xem hết thẻ rồi!`,
  gameDone: (name: string) => `Giỏi quá! ${name} làm xong rồi!`,
  storyDone: 'Hết bài rồi. Con giỏi lắm!',
  tryVoice: 'Con mèo',
  praise: ['Chuẩn luôn!', 'Tuyệt vời!', 'Giỏi quá!', 'Hay lắm!'],

  // Mảnh câu dùng trong trò chơi
  thisIs: 'Đây là',
  meetFriends: 'Mình cùng làm quen nhé!',
  whatIsIt: 'Đây là gì nhỉ?',
  peek: 'Soi kính lúp xem nào!',
  correct: 'Đúng rồi!',
  tryAgain: 'Thử lại nhé!',
  pick: 'Bé hãy chọn đúng hình',
  find: 'Bé tìm',
  pickTopic: 'Bé chọn chủ đề nhé!',
  dragHint: 'Bé kéo hình vào tranh nhé!',
  clearAll: 'Xóa hết rồi, mình dán lại nào!',

  // Giai đoạn 3 — Tư duy
  shadowHint: 'Bé kéo mỗi bạn về đúng cái bóng nhé!',
  howMany: 'Bé đếm xem có bao nhiêu',
  sequenceHint: 'Bé làm giống hình mẫu nhé!',
  towerHint: 'Bé xếp vòng to nhất trước nhé!',
  towerSmaller: 'Chưa đúng, vòng này nhỏ quá!',
  rotateHint: 'Bé chạm để xoay cho đúng hình nhé!',
  threadHint: 'Bé kéo sợi chỉ đi theo đường chấm, xỏ qua lỗ kim nhé!',
  threadOff: 'Ối, chỉ tuột rồi! Thử lại nhé!',
  dressHint: 'Bé mặc quần áo cho gấu nhé!',
  memoryHint: 'Bé lật hai thẻ giống nhau nhé!',

  // Giai đoạn 4 — Nghệ thuật, Âm nhạc, Toán
  traceHint: 'Bé tô theo nét chấm nhé!',
  colorHint: 'Bé chọn màu rồi chạm vào tranh để tô nhé!',
  drawHint: 'Bé vẽ gì cũng được nhé!',
  saved: 'Cô cất tranh vào bộ sưu tập rồi nhé!',
  noteHint: 'Bé đặt nốt',
  onKey: 'lên đúng phím nhé!',
  listenSound: 'Bé nghe xem đây là tiếng gì?',
  eggsHint: 'Có bao nhiêu quả trứng?',
  missingHint: 'Số nào còn thiếu nhỉ?',
  potHint: 'Bé chọn chậu có',
  flowers: 'bông hoa',
  compareHint: 'Bé kéo dấu vào ô trống nhé!',
  bigger: 'lớn hơn',
  smaller: 'bé hơn',
  equal: 'bằng',
  writeHint: 'Bé tập viết số nhé!',
  practice: 'Mình cùng luyện tập nhé!',
  countTogether: 'Mình cùng đếm nhé!',

  // Góc phụ huynh — hết giờ chơi trong ngày
  bedtime: 'Gấu đi ngủ rồi. Con cũng nghỉ ngơi nhé, mai mình chơi tiếp!',
  // Phần thưởng: Sổ sticker, Gấu nhảy múa
  newSticker: 'Con được sticker mới!',
  stickerBook: 'Sổ sticker',
  stickerBookHello: 'Sổ sticker của con đây!',
  stickerLocked: 'Bé chơi thật giỏi để nhận sticker này nhé!',
  stickerPages: ['Con vật', 'Xe cộ', 'Đồ ăn', 'Vũ trụ'],
  dance: 'Cùng nhảy với Gấu nào!',
  // Bài học hôm nay
  dailyLesson: 'Bài học hôm nay',
  dailyStart: 'Bé chạm vào trạm đầu tiên nhé!',
  dailyNext: 'Bé chạm vào trạm sáng nhé!',
  dailyDone: 'Giỏi quá! Con đã học xong bài hôm nay!',
  /** "Con đã học" + NUMBER_WORDS[n] + "ngày liền!" — ghép bằng sayAll. */
  streakPre: 'Con đã học',
  streakPost: 'ngày liền!',
  // Ảnh gia đình (ảnh riêng trên máy). Nhãn Bố/Mẹ/Ông/Bà/Em bé/Anh trai đã có giọng từ chủ đề Gia đình.
  familyTopic: 'Gia đình của Gấu',
  familyLabels: ['Gấu Anh', 'Gấu Em', 'Cả nhà', 'Bố và mẹ', 'Ông bà', 'Gấu Anh và Gấu Em', 'Gấu Anh đeo kính'],
  // Trò Montessori: Phân loại màu, To và nhỏ, Mẹ và con
  colorSortHint: 'Bé bỏ đồ vật vào giỏ cùng màu nhé!',
  /** "Bé tìm" + "Con mèo" + "to nhất"/"nhỏ nhất" — ghép bằng sayAll. */
  biggest: 'to nhất',
  smallest: 'nhỏ nhất',
  bigHouse: 'Nhà to',
  smallHouse: 'Nhà nhỏ',
  momBabyHint: 'Bé đưa con về với mẹ nhé!',
  montessoriNames: MONTESSORI_NAMES,
  // Gấu biết nói (màn chơi tự do: nhại giọng, chạm, chăm sóc)
  talkingBear: 'Gấu biết nói',
  bearHello: 'Chào bạn! Bạn nói gì, Gấu nói theo nhé!',
  bearNeedMic: 'Nhờ bố mẹ bật micro cho Gấu nhé!',
  bearHungry: 'Gấu đói bụng rồi!',
  bearYummy: 'Măm măm, ngon quá!',
  bearThirsty: 'Gấu muốn uống sữa!',
  bearMilk: 'Ực ực, sữa ngon quá!',
  bearBath: 'Mình đi tắm nào!',
  bearBathDone: 'Tắm xong thơm phức!',
  bearSleepy: 'Gấu buồn ngủ quá…',
  bearGoodNight: 'Chúc Gấu ngủ ngon!',
  bearWake: 'Gấu dậy rồi!',
} as const;

/** Tên các trò chơi (đọc khi bé chạm vào). Được điền thêm từ danh sách trò chơi. */
export const GAME_TITLES = ['Truyện thơ tiềm thức', 'Nghe và tìm', 'Đại dương', 'Rừng rậm', 'Dán hình', 'Nông trại', 'Thơ', 'Đồng dao', 'Truyện', 'Ca dao'];

/** Các câu cố định (đã thay tên bé mặc định) để thu sẵn. */
export function fixedPhrases(moduleTitles: string[], maxTopics: number, extra: string[] = []): string[] {
  const n = DEFAULT_CHILD;
  const flat = Object.values(PHRASES).flatMap((v) => (typeof v === 'string' ? [v] : Array.isArray(v) ? v : []));
  return [
    ...flat, PHRASES.greet(n), PHRASES.maxTopics(maxTopics), PHRASES.done(n), PHRASES.gameDone(n),
    ...NUMBER_WORDS, ...GAME_TITLES, ...moduleTitles, ...moduleTitles.map((m) => PHRASES.comingSoon(m, n)), ...extra,
  ];
}
