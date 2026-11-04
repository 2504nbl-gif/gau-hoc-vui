import type { Topic } from '@/types/content';
import { emojiItems } from '../build';

export const animalTopics: Topic[] = [
  {
    id: 'pets', group: 'animals', title: { vi: 'Động vật nuôi', en: 'Farm & pets' },
    items: emojiItems('pets', `🐶|Con chó|Dog; 🐱|Con mèo|Cat; 🐴|Con ngựa|Horse; 🐄|Con bò sữa|Cow; 🐃|Con trâu|Buffalo;
      🐷|Con lợn|Pig; 🐔|Con gà|Chicken; 🦆|Con vịt|Duck; 🐐|Con dê|Goat; 🐑|Con cừu|Sheep; 🐇|Con thỏ|Rabbit; 🦃|Gà tây|Turkey`),
  },
  {
    id: 'sea', group: 'animals', title: { vi: 'Động vật thủy sinh', en: 'Sea animals' },
    items: emojiItems('sea', `🐟|Con cá|Fish; 🐠|Cá nhiệt đới|Tropical fish; 🐡|Cá nóc|Pufferfish; 🦈|Cá mập|Shark; 🐬|Cá heo|Dolphin;
      🐳|Cá voi|Whale; 🐙|Bạch tuộc|Octopus; 🦀|Con cua|Crab; 🦐|Con tôm|Shrimp; 🐢|Con rùa|Turtle; 🦑|Con mực|Squid; 🦭|Hải cẩu|Seal`),
  },
  {
    id: 'wild', group: 'animals', title: { vi: 'Động vật hoang dã', en: 'Wild animals' },
    items: emojiItems('wild', `🐘|Con voi|Elephant; 🦁|Sư tử|Lion; 🐯|Con hổ|Tiger; 🦒|Hươu cao cổ|Giraffe; 🦓|Ngựa vằn|Zebra;
      🐒|Con khỉ|Monkey; 🐻|Con gấu|Bear; 🦊|Con cáo|Fox; 🐺|Chó sói|Wolf; 🦏|Tê giác|Rhino; 🦛|Hà mã|Hippo; 🐊|Cá sấu|Crocodile`),
  },
  {
    id: 'birds', group: 'animals', title: { vi: 'Động vật có cánh', en: 'Birds' },
    items: emojiItems('birds', `🦜|Con vẹt|Parrot; 🦉|Cú mèo|Owl; 🦅|Đại bàng|Eagle; 🐦|Chim sẻ|Sparrow; 🕊️|Bồ câu|Dove;
      🦚|Con công|Peacock; 🦩|Hồng hạc|Flamingo; 🐧|Chim cánh cụt|Penguin; 🦢|Thiên nga|Swan; 🐓|Gà trống|Rooster`),
  },
  {
    id: 'insects', group: 'animals', title: { vi: 'Bọ & côn trùng', en: 'Bugs & insects' },
    items: emojiItems('insects', `🦋|Con bướm|Butterfly; 🐝|Con ong|Bee; 🐞|Bọ rùa|Ladybug; 🐜|Con kiến|Ant; 🦗|Con dế|Cricket;
      🐌|Ốc sên|Snail; 🕷️|Con nhện|Spider; 🐛|Con sâu|Caterpillar; 🪲|Bọ cánh cứng|Beetle; 🦟|Con muỗi|Mosquito`),
  },
];
