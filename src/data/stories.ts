import type { Story } from '@/types/content';

// Thơ và truyện do Gấu Học Vui tự viết; ca dao, đồng dao là bài dân gian truyền miệng.
const e = (value: string) => ({ kind: 'emoji' as const, value });

export const STORIES: Story[] = [
  // ── Thơ ──
  { id: 'tho-yeu-me', kind: 'poem', lang: 'vi', title: 'Yêu mẹ', cover: e('🤱'),
    lines: ['Mẹ ơi con yêu mẹ', 'Như cây yêu nắng vàng', 'Mẹ ru con ngủ ngoan', 'Con thơm lên má mẹ.'] },
  { id: 'tho-ban-moi', kind: 'poem', lang: 'vi', title: 'Bạn mới', cover: e('🧒'),
    lines: ['Hôm nay lớp có bạn', 'Tóc xoăn, má hồng hồng', 'Gấu chìa tay: chơi không?', 'Bạn cười: mình chơi với!'] },
  { id: 'tho-di-hoc', kind: 'poem', lang: 'vi', title: 'Đi học đúng giờ', cover: e('⏰'),
    lines: ['Reng reng chuông đồng hồ', 'Gấu dậy rửa mặt nhanh', 'Ăn sáng thật ngon lành', 'Đến lớp không trễ nữa.'] },
  { id: 'tho-gio', kind: 'poem', lang: 'vi', title: 'Gió', cover: e('🌬️'),
    lines: ['Gió ơi gió ở đâu', 'Gió đưa diều lên cao', 'Gió lay cành lao xao', 'Gió hát ru bé ngủ.'] },
  { id: 'tho-ngoi-nha', kind: 'poem', lang: 'vi', title: 'Ngôi nhà của bé', cover: e('🏡'),
    lines: ['Nhà bé có mái đỏ', 'Có cửa sổ xanh xanh', 'Có bố mẹ, có anh', 'Ai cũng thương bé lắm.'] },
  { id: 'tho-co-day', kind: 'poem', lang: 'vi', title: 'Cô dạy', cover: e('👩‍🏫'),
    lines: ['Cô dạy bé chào hỏi', 'Cô dạy bé hát ca', 'Về nhà bé khoe bà', 'Bà khen: cháu giỏi quá!'] },
  { id: 'tho-rua-tay', kind: 'poem', lang: 'vi', title: 'Rửa tay', cover: e('🧼'),
    lines: ['Xoa xoa xà phòng', 'Kỳ kỳ ngón tay', 'Nước mát rửa ngay', 'Đôi tay sạch sẽ.'] },
  { id: 'tho-an-ngoan', kind: 'poem', lang: 'vi', title: 'Ăn ngoan', cover: e('🥣'),
    lines: ['Bát cơm thơm phức', 'Có cá, có rau', 'Gấu ăn thật mau', 'Lớn nhanh khỏe mạnh.'] },

  { id: 'tho-chao-sang', kind: 'poem', lang: 'vi', title: 'Chào buổi sáng', cover: e('🌅'),
    lines: ['Ò ó o gà gáy', 'Mặt trời dậy rồi kìa', 'Gấu vươn vai một cái', 'Chào buổi sáng, cả nhà!'] },
  { id: 'tho-danh-rang', kind: 'poem', lang: 'vi', title: 'Đánh răng', cover: e('🪥'),
    lines: ['Bàn chải xinh xinh', 'Kem thơm mát lạnh', 'Chải lên chải xuống', 'Răng trắng tinh tinh.'] },
  { id: 'tho-mua-roi', kind: 'poem', lang: 'vi', title: 'Mưa rơi', cover: e('🌧️'),
    lines: ['Tí tách tí tách', 'Mưa rơi ngoài hiên', 'Cây xanh uống nước', 'Hoa cười hồn nhiên.'] },
  { id: 'tho-bo', kind: 'poem', lang: 'vi', title: 'Bố của bé', cover: e('👨'),
    lines: ['Bố cao thật cao', 'Cõng bé đi chơi', 'Bé ôm cổ bố', 'Cười vang khắp nơi.'] },
  { id: 'tho-ong-trang', kind: 'poem', lang: 'vi', title: 'Trăng tròn', cover: e('🌕'),
    lines: ['Ông trăng tròn tròn', 'Treo trên ngọn tre', 'Gấu ngồi ngoài hè', 'Ngắm trăng sáng quá.'] },
  { id: 'tho-ga-con', kind: 'poem', lang: 'vi', title: 'Chú gà con', cover: e('🐥'),
    lines: ['Chiếp chiếp chiếp chiếp', 'Lông vàng như tơ', 'Chạy theo mẹ gà', 'Tìm thóc bên bờ.'] },
  { id: 'tho-ca-vang', kind: 'poem', lang: 'vi', title: 'Con cá vàng', cover: e('🐠'),
    lines: ['Cá vàng bơi bơi', 'Đuôi xòe như quạt', 'Bé thả mồi nhé', 'Cá đớp ngon lành.'] },
  { id: 'tho-di-ngu', kind: 'poem', lang: 'vi', title: 'Đi ngủ', cover: e('🛏️'),
    lines: ['Trăng lên cao rồi', 'Gấu lên giường thôi', 'Ôm gấu bông nhé', 'Ngủ ngon, mai chơi.'] },
  { id: 'tho-cau-vong', kind: 'poem', lang: 'vi', title: 'Cầu vồng', cover: e('🌈'),
    lines: ['Mưa vừa tạnh xong', 'Trời có cầu vồng', 'Đỏ, cam, vàng, lục', 'Lam, chàm, tím trong.'] },
  { id: 'tho-tap-dem', kind: 'poem', lang: 'vi', title: 'Bé tập đếm', cover: e('🔢'),
    lines: ['Một là con mèo', 'Hai là con cá', 'Ba là quả na', 'Bốn là bông hoa.'] },
  { id: 'tho-chu-buom', kind: 'poem', lang: 'vi', title: 'Chú bướm vàng', cover: e('🦋'),
    lines: ['Chú bướm vàng ơi', 'Bay đi đâu đấy', 'Bay vào vườn này', 'Hoa đang đợi đấy.'] },
  { id: 'tho-cat-do-choi', kind: 'poem', lang: 'vi', title: 'Cất đồ chơi', cover: e('🧸'),
    lines: ['Chơi xong rồi nhé', 'Cất đồ chơi đi', 'Xe vào trong hộp', 'Gấu bông lên kệ.'] },

  // ── Ca dao (dân gian) ──
  { id: 'cd-cong-cha', kind: 'folk', lang: 'vi', title: 'Công cha như núi Thái Sơn', cover: e('⛰️'),
    lines: ['Công cha như núi Thái Sơn', 'Nghĩa mẹ như nước trong nguồn chảy ra', 'Một lòng thờ mẹ kính cha', 'Cho tròn chữ hiếu mới là đạo con.'] },
  { id: 'cd-bau-bi', kind: 'folk', lang: 'vi', title: 'Bầu ơi thương lấy bí cùng', cover: e('🎃'),
    lines: ['Bầu ơi thương lấy bí cùng', 'Tuy rằng khác giống nhưng chung một giàn.'] },
  { id: 'cd-con-kien', kind: 'folk', lang: 'vi', title: 'Con kiến mà leo cành đa', cover: e('🐜'),
    lines: ['Con kiến mà leo cành đa', 'Leo phải cành cụt leo ra leo vào', 'Con kiến mà leo cành đào', 'Leo phải cành cụt leo vào leo ra.'] },
  { id: 'cd-trau-oi', kind: 'folk', lang: 'vi', title: 'Trâu ơi ta bảo trâu này', cover: e('🐃'),
    lines: ['Trâu ơi ta bảo trâu này', 'Trâu ra ngoài ruộng trâu cày với ta', 'Cấy cày vốn nghiệp nông gia', 'Ta đây trâu đấy ai mà quản công.'] },
  { id: 'cd-con-co', kind: 'folk', lang: 'vi', title: 'Con cò mà đi ăn đêm', cover: e('🦢'),
    lines: ['Con cò mà đi ăn đêm', 'Đậu phải cành mềm lộn cổ xuống ao', 'Ông ơi ông vớt tôi nao', 'Tôi có lòng nào ông hãy xáo măng', 'Có xáo thì xáo nước trong', 'Đừng xáo nước đục đau lòng cò con.'] },

  // ── Đồng dao ──
  { id: 'dd-thang-bom', kind: 'rhyme', lang: 'vi', title: 'Thằng Bờm', cover: e('🪭'),
    lines: ['Thằng Bờm có cái quạt mo', 'Phú ông xin đổi ba bò chín trâu', 'Bờm rằng Bờm chẳng lấy trâu', 'Phú ông xin đổi một xâu cá mè', 'Bờm rằng Bờm chẳng lấy mè', 'Phú ông xin đổi một bè gỗ lim', 'Bờm rằng Bờm chẳng lấy lim', 'Phú ông xin đổi đôi chim đồi mồi', 'Bờm rằng Bờm chẳng lấy mồi', 'Phú ông xin đổi nắm xôi, Bờm cười.'] },
  { id: 'dd-cai-bong', kind: 'rhyme', lang: 'vi', title: 'Cái bống', cover: e('🐟'),
    lines: ['Cái bống là cái bống bang', 'Khéo sảy khéo sàng cho mẹ nấu cơm', 'Mẹ bống đi chợ đường trơn', 'Bống ra gánh đỡ chạy cơn mưa ròng.'] },
  { id: 'dd-ong-giang', kind: 'rhyme', lang: 'vi', title: 'Ông giẳng ông giăng', cover: e('🌙'),
    lines: ['Ông giẳng ông giăng', 'Xuống chơi với tôi', 'Có bầu có bạn', 'Có ván cơm xôi', 'Có nồi cơm nếp', 'Có nệp bánh chưng', 'Có lưng hũ rượu', 'Có chiếu bám đu.'] },
  { id: 'dd-con-ga', kind: 'rhyme', lang: 'vi', title: 'Con gà cục tác lá chanh', cover: e('🐔'),
    lines: ['Con gà cục tác lá chanh', 'Con lợn ủn ỉn mua hành cho tôi', 'Con chó khóc đứng khóc ngồi', 'Mẹ ơi đi chợ mua tôi đồng riềng.'] },

  // ── Đồng dao ──
  { id: 'dd-dung-dang', kind: 'rhyme', lang: 'vi', title: 'Dung dăng dung dẻ', cover: e('🧒'),
    lines: ['Dung dăng dung dẻ', 'Dắt trẻ đi chơi', 'Đến cửa nhà trời', 'Lạy cậu lạy mợ', 'Cho cháu về quê', 'Cho dê đi học', 'Cho cóc ở nhà', 'Cho gà bới bếp', 'Ngồi xệp xuống đây.'] },
  { id: 'dd-con-meo', kind: 'rhyme', lang: 'vi', title: 'Con mèo mà trèo cây cau', cover: e('🐈'),
    lines: ['Con mèo mà trèo cây cau', 'Hỏi thăm chú chuột đi đâu vắng nhà', 'Chú chuột đi chợ đường xa', 'Mua mắm mua muối giỗ cha con mèo.'] },
  { id: 'dd-keo-cua', kind: 'rhyme', lang: 'vi', title: 'Kéo cưa lừa xẻ', cover: e('🪚'),
    lines: ['Kéo cưa lừa xẻ', 'Ông thợ nào khỏe', 'Về ăn cơm vua', 'Ông thợ nào thua', 'Về bú tí mẹ.'] },
  { id: 'dd-nu-na', kind: 'rhyme', lang: 'vi', title: 'Nu na nu nống', cover: e('🦶'),
    lines: ['Nu na nu nống', 'Cái cống nằm trong', 'Cái ong nằm ngoài', 'Củ khoai chấm mật', 'Phật ngồi phật khóc', 'Con cóc nhảy ra', 'Con gà ú ụ', 'Nhà mụ thổi xôi', 'Nhà tôi nấu chè', 'Tay xòe chân rụt.'] },
  { id: 'dd-ba-cong', kind: 'rhyme', lang: 'vi', title: 'Bà còng đi chợ', cover: e('👵'),
    lines: ['Bà còng đi chợ trời mưa', 'Cái tôm cái tép đi đưa bà còng', 'Đưa bà qua quãng đường đông', 'Đưa bà vào tận ngõ trong nhà bà.'] },

  // ── Truyện ──
  { id: 'tr-rua-tho', kind: 'story', lang: 'vi', title: 'Rùa và Thỏ', cover: e('🐢'),
    lines: ['Thỏ chạy rất nhanh nên hay chê Rùa chậm chạp.', 'Rùa bảo: mình thi chạy nhé!', 'Thỏ chạy vèo một cái đã xa, rồi nằm dưới gốc cây ngủ khì.', 'Rùa cứ chậm mà chắc, bò mãi, bò mãi không nghỉ.', 'Khi Thỏ tỉnh dậy, Rùa đã tới đích rồi.', 'Chăm chỉ từng chút sẽ thành công.'] },
  { id: 'tr-gau-mat', kind: 'story', lang: 'vi', title: 'Gấu con và hũ mật', cover: e('🍯'),
    lines: ['Gấu con tìm được một hũ mật ong thơm lừng.', 'Gấu định ăn một mình thì thấy bạn Sóc đang đói bụng.', 'Gấu nghĩ một lát, rồi chia cho Sóc một nửa.', 'Hai bạn cùng ăn, cùng cười, mật ngọt hơn hẳn.', 'Chia sẻ với bạn bè làm mình vui hơn đấy!'] },
  { id: 'tr-kien-bo-cau', kind: 'story', lang: 'vi', title: 'Kiến và Bồ Câu', cover: e('🐜'),
    lines: ['Một chú Kiến bị rơi xuống suối.', 'Bồ Câu thả một chiếc lá, Kiến bám vào và lên bờ.', 'Hôm sau, có người định bắt Bồ Câu.', 'Kiến bò tới cắn vào chân người đó, Bồ Câu bay thoát.', 'Giúp bạn hôm nay, mai bạn giúp lại mình.'] },
  { id: 'tr-ngoi-sao', kind: 'story', lang: 'vi', title: 'Ngôi sao nhỏ đi ngủ', cover: e('⭐'),
    lines: ['Trên trời có một ngôi sao nhỏ không chịu đi ngủ.', 'Mặt Trăng hỏi: sao con còn thức?', 'Sao nhỏ nói: con sợ ngủ rồi không ai chiếu sáng.', 'Mặt Trăng cười: con ngủ đi, sáng mai Mặt Trời sẽ dậy.', 'Sao nhỏ nhắm mắt, mơ một giấc mơ thật đẹp.'] },
];

export const STORY_KINDS: { kind: Story['kind']; title: string }[] = [
  { kind: 'poem', title: 'Thơ' },
  { kind: 'rhyme', title: 'Đồng dao' },
  { kind: 'folk', title: 'Ca dao' },
  { kind: 'story', title: 'Truyện' },
];
