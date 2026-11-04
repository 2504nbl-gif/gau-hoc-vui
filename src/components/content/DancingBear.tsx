// Gấu nâu nhảy múa — chính là BearCharacter ở tư thế 'dance' (một nhân vật dùng chung cả app).
// `dancing` = false thì gấu đứng yên, dùng được làm hình minh họa.
import { BearCharacter } from './BearCharacter';

export function DancingBear({ dancing = true, beat = 0.44, className = '' }: { dancing?: boolean; beat?: number; className?: string }) {
  return <BearCharacter pose={dancing ? 'dance' : 'idle'} eyes="happy" beat={beat} className={className} />;
}
