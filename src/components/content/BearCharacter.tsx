// Gấu nâu của app — MỘT nhân vật dùng chung (vẽ riêng bằng SVG + CSS, không dùng nhân vật có bản quyền).
// Có trạng thái: tư thế (pose), mắt, miệng; chạm vào từng vùng (đầu, mũi, bụng, chân) báo qua onPart.
// Miệng 'talk' mở theo biến CSS --mouth (0–1) đặt ở phần tử cha → cập nhật 60 hình/giây mà không phải vẽ lại React.
import type { CSSProperties, PointerEvent } from 'react';

export type BearPose = 'idle' | 'dance' | 'listen' | 'giggle' | 'jump' | 'sneeze' | 'bliss' | 'eat' | 'sleep';
export type BearEyes = 'open' | 'happy' | 'closed' | 'wide';
export type BearMouth = 'smile' | 'talk' | 'open' | 'o' | 'chew';
export type BearPart = 'head' | 'nose' | 'belly' | 'feet';

const CSS = `
.gb * { transform-box: view-box; }
.gb-all { transform-origin: 100px 230px; }
.gb-head { transform-origin: 100px 122px; transition: transform .35s cubic-bezier(.3,1.6,.5,1); }
.gb-ear-l { transform-origin: 72px 52px; transition: transform .3s cubic-bezier(.3,1.8,.5,1); }
.gb-ear-r { transform-origin: 128px 52px; transition: transform .3s cubic-bezier(.3,1.8,.5,1); }
.gb-eyes { transform-origin: 100px 62px; }
.gb-talk { transform-origin: 100px 93px; transform: scaleY(calc(var(--mouth, 0) * 1.25)); }
.gb-chew { transform-origin: 100px 95px; animation: gb-chew .22s ease-in-out infinite alternate; }
.gb-arm-l { transform-origin: 58px 128px; }
.gb-arm-r { transform-origin: 142px 128px; }
.gb-belly { transform-origin: 100px 172px; }

/* nhảy múa */
.gb-dance .gb-all  { animation: gb-bounce var(--beat) ease-in-out infinite; }
.gb-dance .gb-head { animation: gb-head calc(var(--beat) * 2) ease-in-out infinite; }
.gb-dance .gb-arm-l { animation: gb-arm-l calc(var(--beat) * 2) ease-in-out infinite; }
.gb-dance .gb-arm-r { animation: gb-arm-r calc(var(--beat) * 2) ease-in-out infinite; }
.gb-dance .gb-leg-l { animation: gb-leg var(--beat) ease-in-out infinite; transform-origin: 78px 190px; }
.gb-dance .gb-leg-r { animation: gb-leg var(--beat) ease-in-out infinite calc(var(--beat) / -2); transform-origin: 122px 190px; }
/* đứng yên: thở nhẹ + chớp mắt */
.gb-idle .gb-all, .gb-listen .gb-all { animation: gb-breathe 3s ease-in-out infinite; }
.gb-blink .gb-eyes { animation: gb-blink 4.2s infinite; }
/* đang nghe: nghiêng đầu, tai vểnh */
.gb-listen .gb-head { transform: rotate(-11deg); }
.gb-listen .gb-ear-l { transform: translate(-3px, -7px) rotate(-14deg) scale(1.12); }
.gb-listen .gb-ear-r { transform: translate(3px, -7px) rotate(14deg) scale(1.12); }
/* cười khúc khích: rung cả người, bụng nảy */
.gb-giggle .gb-all { animation: gb-shake .13s linear infinite; }
.gb-giggle .gb-belly { animation: gb-jiggle .18s ease-in-out infinite alternate; }
.gb-giggle .gb-arm-l { transform: rotate(35deg); }
.gb-giggle .gb-arm-r { transform: rotate(-35deg); }
/* giật mình nhảy */
.gb-jump .gb-all { animation: gb-jump .9s cubic-bezier(.3,.7,.4,1) both; }
.gb-jump .gb-arm-l { animation: gb-arm-up .9s ease both; }
.gb-jump .gb-arm-r { animation: gb-arm-up-r .9s ease both; }
.gb-jump .gb-ear-l { transform: translateY(-8px) rotate(-18deg); }
.gb-jump .gb-ear-r { transform: translateY(-8px) rotate(18deg); }
/* hắt xì */
.gb-sneeze .gb-head { animation: gb-sneeze 1.25s ease both; }
/* sung sướng */
.gb-bliss .gb-head { animation: gb-sway 1.1s ease-in-out infinite alternate; }
.gb-bliss .gb-cheek { opacity: .95; }
/* ăn: gật gù */
.gb-eat .gb-head { animation: gb-nod .44s ease-in-out infinite alternate; }
/* ngủ: gục đầu, thở chậm */
.gb-sleep .gb-head { transform: rotate(9deg) translateY(5px); }
.gb-sleep .gb-all { animation: gb-breathe 4s ease-in-out infinite; }

@keyframes gb-bounce {
  0%, 100% { transform: translateY(0) rotate(0); }
  25% { transform: translateY(-16px) rotate(-5deg); }
  50% { transform: translateY(0) rotate(0); }
  75% { transform: translateY(-16px) rotate(5deg); }
}
@keyframes gb-head { 0%, 100% { transform: rotate(-9deg); } 50% { transform: rotate(9deg); } }
@keyframes gb-arm-l { 0%, 100% { transform: rotate(20deg); } 50% { transform: rotate(140deg); } }
@keyframes gb-arm-r { 0%, 100% { transform: rotate(-140deg); } 50% { transform: rotate(-20deg); } }
@keyframes gb-leg { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px) rotate(-8deg); } }
@keyframes gb-breathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.012, 1.025); } }
@keyframes gb-blink { 0%, 94%, 100% { transform: scaleY(1); } 97% { transform: scaleY(.1); } }
@keyframes gb-chew { from { transform: scaleY(.25); } to { transform: scaleY(1.1); } }
@keyframes gb-shake { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-2.5deg); } 75% { transform: rotate(2.5deg); } }
@keyframes gb-jiggle { from { transform: scale(1, 1); } to { transform: scale(1.08, .93); } }
@keyframes gb-jump {
  0% { transform: translateY(0) scale(1, 1); }
  12% { transform: translateY(6px) scale(1.08, .9); }
  40% { transform: translateY(-62px) scale(.95, 1.06); }
  72% { transform: translateY(0) scale(1.1, .88); }
  86% { transform: translateY(-8px) scale(1, 1); }
  100% { transform: translateY(0) scale(1, 1); }
}
@keyframes gb-arm-up { 0%, 100% { transform: rotate(0); } 30%, 60% { transform: rotate(150deg); } }
@keyframes gb-arm-up-r { 0%, 100% { transform: rotate(0); } 30%, 60% { transform: rotate(-150deg); } }
@keyframes gb-sneeze {
  0% { transform: rotate(0); }
  50% { transform: rotate(-12deg) translateY(-4px); }
  62% { transform: rotate(10deg) translateY(8px); }
  78% { transform: rotate(-3deg); }
  100% { transform: rotate(0); }
}
@keyframes gb-sway { from { transform: rotate(-7deg); } to { transform: rotate(7deg); } }
@keyframes gb-nod { from { transform: rotate(-2deg) translateY(0); } to { transform: rotate(2deg) translateY(3px); } }
`;

const FUR = '#b9774a';
const DARK = '#a8693f';
const LIGHT = '#f3d2ab';
const EAR = '#ebb88d';
const INK = '#2d2420';
const LIP = '#c2414f';

/** Mắt và miệng mặc định theo tư thế. */
const FACE: Record<BearPose, [BearEyes, BearMouth]> = {
  idle: ['open', 'smile'], dance: ['happy', 'smile'], listen: ['open', 'smile'], giggle: ['happy', 'open'],
  jump: ['wide', 'o'], sneeze: ['closed', 'o'], bliss: ['happy', 'smile'], eat: ['happy', 'chew'], sleep: ['closed', 'smile'],
};

function Eyes({ kind }: { kind: BearEyes }) {
  if (kind === 'happy') return (
    <>
      <path d="M77 64 Q83 57 89 64" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M111 64 Q117 57 123 64" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
    </>
  );
  if (kind === 'closed') return (
    <>
      <path d="M77 62 Q83 67 89 62" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M111 62 Q117 67 123 62" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  );
  const r = kind === 'wide' ? 8.5 : 6.5;
  return (
    <>
      {kind === 'wide' && <><circle cx="83" cy="62" r="11" fill="#fff" /><circle cx="117" cy="62" r="11" fill="#fff" /></>}
      <circle cx="83" cy="62" r={r} fill={INK} /><circle cx="117" cy="62" r={r} fill={INK} />
      <circle cx="85.5" cy="59.5" r={r / 3} fill="#fff" /><circle cx="119.5" cy="59.5" r={r / 3} fill="#fff" />
    </>
  );
}

function Mouth({ kind }: { kind: BearMouth }) {
  switch (kind) {
    case 'smile': return <path d="M90 92 Q100 104 110 92 Z" fill={LIP} />;
    case 'open': return (
      <g><ellipse cx="100" cy="97" rx="11" ry="9" fill={LIP} /><ellipse cx="100" cy="102" rx="6" ry="3.5" fill="#f08a8a" /></g>
    );
    case 'o': return <ellipse cx="100" cy="97" rx="5.5" ry="6.5" fill={LIP} />;
    case 'chew': return <ellipse className="gb-chew" cx="100" cy="96" rx="9" ry="6" fill={LIP} />;
    case 'talk': return (
      <>
        {/* miệng mở theo --mouth; khi im lặng chỉ còn nét cười */}
        <g className="gb-talk"><ellipse cx="100" cy="98" rx="10" ry="8" fill={LIP} /><ellipse cx="100" cy="103" rx="5.5" ry="3" fill="#f08a8a" /></g>
        <path d="M91 93 Q100 99 109 93" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    );
  }
}

interface Props {
  pose?: BearPose;
  eyes?: BearEyes;
  mouth?: BearMouth;
  /** Giây mỗi nhịp khi nhảy. */
  beat?: number;
  /** Chạm vào một vùng trên người gấu. */
  onPart?: (part: BearPart, e: PointerEvent<SVGSVGElement>) => void;
  className?: string;
  style?: CSSProperties;
}

export function BearCharacter({ pose = 'idle', eyes, mouth, beat = 0.44, onPart, className = '', style }: Props) {
  const [e, m] = FACE[pose];
  const eyeKind = eyes ?? e;
  const blink = eyeKind === 'open' && pose !== 'sleep';
  const hit = onPart
    ? (ev: PointerEvent<SVGSVGElement>) => {
        const part = (ev.target as Element).closest('[data-part]')?.getAttribute('data-part') as BearPart | null;
        if (part) onPart(part, ev);
      }
    : undefined;
  return (
    <svg
      viewBox="0 0 200 240"
      className={`gb gb-${pose} ${blink ? 'gb-blink' : ''} ${className}`}
      style={{ ['--beat' as string]: `${beat}s`, overflow: 'visible', ...style }}
      onPointerDown={hit}
      aria-hidden
    >
      <style>{CSS}</style>
      <g className="gb-all">
        {/* chân */}
        <g data-part="feet">
          <g className="gb-leg-l"><ellipse cx="78" cy="208" rx="24" ry="18" fill={DARK} /><ellipse cx="78" cy="212" rx="12" ry="9" fill={LIGHT} /></g>
          <g className="gb-leg-r"><ellipse cx="122" cy="208" rx="24" ry="18" fill={DARK} /><ellipse cx="122" cy="212" rx="12" ry="9" fill={LIGHT} /></g>
        </g>
        <g data-part="belly">
          {/* tay (đặt sau thân) */}
          <g className="gb-arm-l"><rect x="44" y="124" width="26" height="58" rx="13" fill={DARK} /><circle cx="57" cy="176" r="11" fill={LIGHT} /></g>
          <g className="gb-arm-r"><rect x="130" y="124" width="26" height="58" rx="13" fill={DARK} /><circle cx="143" cy="176" r="11" fill={LIGHT} /></g>
          {/* thân + bụng */}
          <ellipse cx="100" cy="162" rx="50" ry="48" fill={FUR} />
          <ellipse className="gb-belly" cx="100" cy="172" rx="31" ry="30" fill={LIGHT} />
          {/* nơ đỏ */}
          <path d="M100 122 L80 112 L80 132 Z M100 122 L120 112 L120 132 Z" fill="#e0547b" />
          <circle cx="100" cy="122" r="6" fill="#c23d63" />
        </g>
        {/* đầu */}
        <g className="gb-head" data-part="head">
          <g className="gb-ear-l"><circle cx="62" cy="40" r="18" fill={DARK} /><circle cx="62" cy="40" r="9" fill={EAR} /></g>
          <g className="gb-ear-r"><circle cx="138" cy="40" r="18" fill={DARK} /><circle cx="138" cy="40" r="9" fill={EAR} /></g>
          <circle cx="100" cy="72" r="46" fill={FUR} />
          <ellipse cx="100" cy="89" rx="21" ry="16" fill={LIGHT} />
          <g className="gb-eyes"><Eyes kind={eyeKind} /></g>
          <Mouth kind={mouth ?? m} />
          <circle className="gb-cheek" cx="72" cy="84" r="7" fill="#f08a8a" opacity=".6" />
          <circle className="gb-cheek" cx="128" cy="84" r="7" fill="#f08a8a" opacity=".6" />
          {/* mũi (vùng chạm rộng hơn hình cho bé dễ trúng) */}
          <g data-part="nose">
            <circle cx="100" cy="81" r="13" fill="transparent" />
            <ellipse cx="100" cy="82" rx="8" ry="6" fill={INK} />
            <ellipse cx="97.5" cy="80" rx="2.5" ry="1.5" fill="#fff" opacity=".5" />
          </g>
        </g>
      </g>
    </svg>
  );
}
