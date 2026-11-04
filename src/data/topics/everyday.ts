import type { Topic } from '@/types/content';
import { emojiItems } from '../build';

export const everydayTopics: Topic[] = [
  {
    id: 'fruits', group: 'food', title: { vi: 'Trái cây', en: 'Fruits' },
    items: emojiItems('fruits', `🍎|Quả táo|Apple; 🍌|Quả chuối|Banana; 🍊|Quả cam|Orange; 🍉|Dưa hấu|Watermelon; 🍇|Chùm nho|Grapes;
      🍓|Dâu tây|Strawberry; 🥭|Quả xoài|Mango; 🍍|Quả dứa|Pineapple; 🥥|Quả dừa|Coconut; 🍐|Quả lê|Pear`),
  },
  {
    id: 'vegetables', group: 'food', title: { vi: 'Rau củ', en: 'Vegetables' },
    items: emojiItems('veg', `🥕|Củ cà rốt|Carrot; 🌽|Bắp ngô|Corn; 🥔|Củ khoai tây|Potato; 🍅|Quả cà chua|Tomato; 🥒|Quả dưa chuột|Cucumber;
      🥦|Bông cải xanh|Broccoli; 🧅|Củ hành|Onion; 🧄|Củ tỏi|Garlic; 🌶️|Quả ớt|Chili; 🍆|Quả cà tím|Eggplant`),
  },
  {
    id: 'vehicles', group: 'vehicles', title: { vi: 'Phương tiện', en: 'Vehicles' },
    items: emojiItems('veh', `🚗|Xe ô tô|Car; 🚌|Xe buýt|Bus; 🚲|Xe đạp|Bicycle; 🏍️|Xe máy|Motorbike; 🚑|Xe cứu thương|Ambulance;
      🚒|Xe cứu hỏa|Fire truck; 🚓|Xe cảnh sát|Police car; ✈️|Máy bay|Airplane; 🚢|Tàu thủy|Ship; 🚁|Trực thăng|Helicopter`),
  },
  {
    id: 'toys', group: 'objects', title: { vi: 'Đồ chơi', en: 'Toys' },
    items: emojiItems('toys', `🧸|Gấu bông|Teddy bear; ⚽|Quả bóng|Ball; 🪁|Cánh diều|Kite; 🎈|Bóng bay|Balloon; 🚂|Tàu hỏa|Toy train;
      🧩|Xếp hình|Puzzle; 🥁|Cái trống|Drum; 🛴|Xe trượt|Scooter; 🎲|Xúc xắc|Dice; 🪀|Con quay yo-yo|Yo-yo`),
  },
  {
    id: 'home', group: 'objects', title: { vi: 'Đồ vật trong nhà', en: 'Things at home' },
    items: emojiItems('home', `🛏️|Cái giường|Bed; 🪑|Cái ghế|Chair; 🚪|Cái cửa|Door; 🛁|Bồn tắm|Bathtub; 📺|Ti vi|TV;
      ⏰|Đồng hồ báo thức|Alarm clock; 🧹|Cái chổi|Broom; 🪥|Bàn chải đánh răng|Toothbrush; 🥄|Cái thìa|Spoon; 🔑|Chìa khóa|Key`),
  },
  {
    id: 'nature', group: 'nature', title: { vi: 'Thiên nhiên', en: 'Nature' },
    items: emojiItems('nature', `☀️|Mặt trời|Sun; 🌙|Mặt trăng|Moon; ⭐|Ngôi sao|Star; ☁️|Đám mây|Cloud; 🌧️|Mưa|Rain;
      🌈|Cầu vồng|Rainbow; 🌳|Cái cây|Tree; 🌸|Bông hoa|Flower; 🌊|Sóng biển|Wave; ⛰️|Ngọn núi|Mountain`),
  },
];
