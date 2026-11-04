import type { Topic } from '@/types/content';
import { emojiItems } from '../build';

// Các chủ đề bổ sung (đợt 2). Mỗi dòng: hình | Tiếng Việt | Tiếng Anh
export const moreTopics: Topic[] = [
  {
    id: 'body', group: 'people', title: { vi: 'Cơ thể của bé', en: 'My body' },
    items: emojiItems('body', `👀|Đôi mắt|Eyes; 👂|Cái tai|Ear; 👃|Cái mũi|Nose; 👄|Cái miệng|Mouth; 🦷|Cái răng|Tooth;
      👅|Cái lưỡi|Tongue; ✋|Bàn tay|Hand; 🦶|Bàn chân|Foot; 💪|Cánh tay|Arm; 🦵|Cái chân|Leg`),
  },
  {
    id: 'family', group: 'people', title: { vi: 'Gia đình', en: 'Family' },
    items: emojiItems('family', `👨|Bố|Dad; 👩|Mẹ|Mom; 👶|Em bé|Baby; 👦|Anh trai|Brother; 👧|Chị gái|Sister;
      👴|Ông|Grandpa; 👵|Bà|Grandma; 🫂|Cả nhà|Family`),
  },
  {
    id: 'jobs', group: 'people', title: { vi: 'Nghề nghiệp', en: 'Jobs' },
    items: emojiItems('jobs', `🧑‍⚕️|Bác sĩ|Doctor; 🧑‍🍳|Đầu bếp|Chef; 🧑‍🚒|Lính cứu hỏa|Firefighter; 👮|Chú công an|Police officer;
      🧑‍🏫|Cô giáo|Teacher; 🧑‍🌾|Bác nông dân|Farmer; 👷|Chú công nhân|Builder; 🧑‍✈️|Phi công|Pilot; 🧑‍🎨|Họa sĩ|Painter; 🧑‍🔧|Thợ sửa chữa|Mechanic`),
  },
  {
    id: 'clothes', group: 'objects', title: { vi: 'Quần áo', en: 'Clothes' },
    items: emojiItems('clothes', `👕|Áo phông|T-shirt; 👖|Quần dài|Trousers; 👗|Cái váy|Dress; 🩳|Quần đùi|Shorts; 🧥|Áo khoác|Coat;
      🧦|Đôi tất|Socks; 👟|Đôi giày|Shoes; 🧢|Cái mũ|Cap; 🧤|Găng tay|Gloves; 🧣|Khăn quàng|Scarf; 👓|Cái kính|Glasses`),
  },
  {
    id: 'meals', group: 'food', title: { vi: 'Món ăn', en: 'Meals' },
    items: emojiItems('meals', `🍚|Bát cơm|Rice; 🍜|Bát phở|Noodle soup; 🥖|Bánh mì|Baguette; 🍳|Trứng ốp la|Fried egg; 🥛|Cốc sữa|Milk;
      🍲|Nồi canh|Soup; 🧀|Phô mai|Cheese; 🍗|Đùi gà|Chicken leg; 🥟|Bánh bao|Dumpling; 🍙|Cơm nắm|Rice ball`),
  },
  {
    id: 'sweets', group: 'food', title: { vi: 'Bánh kẹo', en: 'Treats' },
    items: emojiItems('sweets', `🍦|Kem ốc quế|Ice cream; 🍰|Bánh kem|Cake; 🍪|Bánh quy|Cookie; 🍩|Bánh rán|Doughnut; 🍭|Kẹo mút|Lollipop;
      🍫|Sô cô la|Chocolate; 🧁|Bánh cupcake|Cupcake; 🥮|Bánh trung thu|Mooncake; 🍯|Hũ mật ong|Honey; 🧃|Hộp nước quả|Juice box`),
  },
  {
    id: 'fruits2', group: 'food', title: { vi: 'Trái cây 2', en: 'More fruits' },
    items: emojiItems('fruits2', `🍈|Dưa lưới|Melon; 🍑|Quả đào|Peach; 🍒|Quả anh đào|Cherries; 🥝|Quả kiwi|Kiwi; 🍋|Quả chanh|Lemon;
      🫐|Quả việt quất|Blueberries; 🥑|Quả bơ|Avocado; 🍏|Táo xanh|Green apple; 🥜|Hạt lạc|Peanuts; 🌰|Hạt dẻ|Chestnut`),
  },
  {
    id: 'kitchen', group: 'objects', title: { vi: 'Đồ dùng nhà bếp', en: 'Kitchen' },
    items: emojiItems('kitchen', `🍽️|Cái đĩa|Plate; 🥣|Cái bát|Bowl; 🥢|Đôi đũa|Chopsticks; 🍴|Dao và dĩa|Fork and knife; ☕|Cái cốc|Cup;
      🫖|Ấm trà|Teapot; 🍳|Cái chảo|Frying pan; 🥤|Cốc có ống hút|Cup with straw; 🧂|Lọ muối|Salt; 🫙|Cái lọ|Jar`),
  },
  {
    id: 'bathroom', group: 'objects', title: { vi: 'Vệ sinh cá nhân', en: 'Bathroom' },
    items: emojiItems('bath', `🧼|Xà phòng|Soap; 🪥|Bàn chải đánh răng|Toothbrush; 🧴|Chai dầu gội|Shampoo; 🛁|Bồn tắm|Bathtub; 🚿|Vòi hoa sen|Shower;
      🚽|Bồn cầu|Toilet; 🧻|Giấy vệ sinh|Toilet paper; 🪮|Cái lược|Comb; 🧽|Miếng bọt biển|Sponge; 🪞|Cái gương|Mirror`),
  },
  {
    id: 'school', group: 'objects', title: { vi: 'Đồ dùng học tập', en: 'School things' },
    items: emojiItems('school', `✏️|Bút chì|Pencil; 🖍️|Bút sáp màu|Crayon; 📏|Thước kẻ|Ruler; ✂️|Cái kéo|Scissors; 📚|Quyển sách|Books;
      🎒|Cặp sách|Backpack; 🖊️|Bút bi|Pen; 📒|Quyển vở|Notebook; 🧮|Bàn tính|Abacus; 🖌️|Cọ vẽ|Paintbrush`),
  },
  {
    id: 'electric', group: 'objects', title: { vi: 'Đồ điện trong nhà', en: 'Gadgets' },
    items: emojiItems('elec', `📱|Điện thoại|Phone; 💻|Máy tính|Laptop; 💡|Bóng đèn|Light bulb; 📷|Máy ảnh|Camera; 🎧|Tai nghe|Headphones;
      ⌚|Đồng hồ đeo tay|Watch; 🔋|Cục pin|Battery; 🖨️|Máy in|Printer; 🔦|Đèn pin|Flashlight; 📻|Đài radio|Radio`),
  },
  {
    id: 'tools', group: 'objects', title: { vi: 'Dụng cụ', en: 'Tools' },
    items: emojiItems('tools', `🔨|Cái búa|Hammer; 🪛|Tua vít|Screwdriver; 🔧|Cờ lê|Wrench; 🪚|Cái cưa|Saw; 🪜|Cái thang|Ladder;
      🧲|Nam châm|Magnet; 🪣|Cái xô|Bucket; ⛏️|Cái cuốc|Pickaxe; 🧰|Hộp đồ nghề|Toolbox; 🔩|Con ốc|Nut and bolt`),
  },
  {
    id: 'sports', group: 'objects', title: { vi: 'Thể thao', en: 'Sports' },
    items: emojiItems('sports', `⚽|Bóng đá|Football; 🏀|Bóng rổ|Basketball; 🏐|Bóng chuyền|Volleyball; 🏸|Cầu lông|Badminton; 🏓|Bóng bàn|Table tennis;
      🏊|Bơi lội|Swimming; 🚴|Đạp xe|Cycling; 🤸|Nhào lộn|Cartwheel; ⛸️|Trượt băng|Ice skating; 🥋|Học võ|Martial arts`),
  },
  {
    id: 'instruments', group: 'objects', title: { vi: 'Nhạc cụ', en: 'Instruments' },
    items: emojiItems('instr', `🎹|Đàn piano|Piano; 🎸|Đàn ghi ta|Guitar; 🥁|Cái trống|Drum; 🎺|Kèn trumpet|Trumpet; 🎻|Đàn vi ô lông|Violin;
      🎷|Kèn saxophone|Saxophone; 🪗|Đàn phong cầm|Accordion; 🪘|Trống con|Hand drum; 🔔|Cái chuông|Bell; 🪇|Lục lạc|Maracas`),
  },
  {
    id: 'actions', group: 'people', title: { vi: 'Bé làm gì?', en: 'Actions' },
    items: emojiItems('act', `🏃|Chạy|Run; 🚶|Đi bộ|Walk; 💃|Nhảy múa|Dance; 👏|Vỗ tay|Clap; 👋|Vẫy tay chào|Wave;
      🤗|Ôm|Hug; 🙋|Giơ tay|Raise hand; 🛌|Đi ngủ|Sleep; 🧗|Leo trèo|Climb; 🛀|Tắm|Bath`),
  },
  {
    id: 'feelings', group: 'people', title: { vi: 'Cảm xúc', en: 'Feelings' },
    items: emojiItems('feel', `😀|Vui vẻ|Happy; 😢|Buồn|Sad; 😠|Tức giận|Angry; 😨|Sợ hãi|Scared; 😲|Ngạc nhiên|Surprised;
      😴|Buồn ngủ|Sleepy; 🤒|Bị ốm|Sick; 😋|Ngon quá|Yummy; 🥰|Yêu thương|Loving; 😂|Cười to|Laughing`),
  },
  {
    id: 'weather', group: 'nature', title: { vi: 'Thời tiết', en: 'Weather' },
    items: emojiItems('weather', `☀️|Trời nắng|Sunny; 🌧️|Trời mưa|Rainy; ⛈️|Có sấm sét|Stormy; ❄️|Tuyết rơi|Snowy; 🌬️|Có gió|Windy;
      ☁️|Nhiều mây|Cloudy; 🌤️|Nắng nhẹ|Partly sunny; 🌫️|Sương mù|Foggy; 🌪️|Lốc xoáy|Tornado; 🔥|Nóng quá|Hot`),
  },
  {
    id: 'plants', group: 'nature', title: { vi: 'Cây và hoa', en: 'Plants' },
    items: emojiItems('plants', `🌹|Hoa hồng|Rose; 🌻|Hoa hướng dương|Sunflower; 🌷|Hoa tulip|Tulip; 🌼|Hoa cúc|Daisy; 🪷|Hoa sen|Lotus;
      🌵|Cây xương rồng|Cactus; 🌴|Cây dừa|Palm tree; 🍀|Cỏ bốn lá|Clover; 🍄|Cây nấm|Mushroom; 🌾|Bông lúa|Rice plant; 🍁|Lá phong|Maple leaf`),
  },
  {
    id: 'special', group: 'animals', title: { vi: 'Con vật đặc biệt', en: 'Special animals' },
    items: emojiItems('special', `🦕|Khủng long cổ dài|Long-neck dinosaur; 🦖|Khủng long bạo chúa|T-rex; 🐼|Gấu trúc|Panda; 🐨|Gấu túi|Koala; 🦘|Chuột túi|Kangaroo;
      🦥|Con lười|Sloth; 🦔|Con nhím|Hedgehog; 🦦|Rái cá|Otter; 🐸|Con ếch|Frog; 🐍|Con rắn|Snake; 🦎|Thằn lằn|Lizard; 🐭|Con chuột|Mouse`),
  },
  {
    id: 'space', group: 'nature', title: { vi: 'Vũ trụ', en: 'Space' },
    items: emojiItems('space', `🚀|Tên lửa|Rocket; 🌍|Trái Đất|Earth; 🌙|Mặt Trăng|Moon; ⭐|Ngôi sao|Star; ☀️|Mặt Trời|Sun;
      🪐|Sao Thổ|Saturn; 🧑‍🚀|Phi hành gia|Astronaut; ☄️|Sao chổi|Comet; 🛰️|Vệ tinh|Satellite; 🔭|Kính thiên văn|Telescope; 🛸|Đĩa bay|UFO`),
  },
  {
    id: 'places', group: 'objects', title: { vi: 'Nơi chốn', en: 'Places' },
    items: emojiItems('places', `🏠|Ngôi nhà|House; 🏫|Trường học|School; 🏥|Bệnh viện|Hospital; 🏪|Cửa hàng|Shop; 🏞️|Công viên|Park;
      🏖️|Bãi biển|Beach; 🏰|Lâu đài|Castle; ⛺|Lều cắm trại|Tent; 🏟️|Sân vận động|Stadium; 🏭|Nhà máy|Factory`),
  },
  {
    id: 'vehicles2', group: 'vehicles', title: { vi: 'Phương tiện 2', en: 'More vehicles' },
    items: emojiItems('veh2', `🚜|Máy kéo|Tractor; 🏗️|Cần cẩu|Crane; 🚚|Xe tải|Truck; 🚕|Xe taxi|Taxi; 🛵|Xe tay ga|Scooter;
      🚐|Xe khách nhỏ|Minibus; 🚎|Xe điện|Trolleybus; 🚠|Cáp treo|Cable car; ⛵|Thuyền buồm|Sailboat; 🚤|Ca nô|Speedboat`),
  },
  {
    id: 'traffic', group: 'objects', title: { vi: 'An toàn giao thông', en: 'Road safety' },
    items: emojiItems('traffic', `🚦|Đèn giao thông|Traffic light; 🚸|Trẻ em qua đường|Children crossing; 🛑|Biển dừng lại|Stop sign; ⛔|Cấm đi vào|No entry; 🚧|Công trường|Road works;
      ⛑️|Mũ bảo hiểm|Helmet; 🦺|Áo phản quang|Safety vest; 🌉|Cây cầu|Bridge; 🛣️|Đường cao tốc|Highway; 🚏|Trạm xe buýt|Bus stop`),
  },
  {
    id: 'festivals', group: 'objects', title: { vi: 'Lễ hội', en: 'Celebrations' },
    items: emojiItems('fest', `🧧|Bao lì xì|Red envelope; 🏮|Đèn lồng|Lantern; 🎆|Pháo hoa|Fireworks; 🎂|Bánh sinh nhật|Birthday cake; 🎁|Hộp quà|Gift;
      🎄|Cây thông Noel|Christmas tree; 🎃|Quả bí ngô|Pumpkin; 🎉|Bữa tiệc|Party; 🌕|Trăng rằm|Full moon; 🎏|Cờ cá chép|Carp streamer`),
  },
];
