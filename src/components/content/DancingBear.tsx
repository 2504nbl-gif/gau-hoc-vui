// Gấu nâu nhảy múa (vẽ riêng bằng SVG + CSS, không dùng nhân vật có bản quyền).
// `dancing` = false thì gấu đứng yên, dùng được làm hình minh họa.

const CSS = `
.gb * { transform-box: view-box; }
.gb-on .gb-all  { animation: gb-bounce var(--beat) ease-in-out infinite; transform-origin: 100px 230px; }
.gb-on .gb-head { animation: gb-head calc(var(--beat) * 2) ease-in-out infinite; transform-origin: 100px 122px; }
.gb-on .gb-arm-l { animation: gb-arm-l calc(var(--beat) * 2) ease-in-out infinite; transform-origin: 58px 128px; }
.gb-on .gb-arm-r { animation: gb-arm-r calc(var(--beat) * 2) ease-in-out infinite; transform-origin: 142px 128px; }
.gb-on .gb-leg-l { animation: gb-leg var(--beat) ease-in-out infinite; transform-origin: 78px 190px; }
.gb-on .gb-leg-r { animation: gb-leg var(--beat) ease-in-out infinite calc(var(--beat) / -2); transform-origin: 122px 190px; }
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
`;

const FUR = '#b9774a';
const DARK = '#a8693f';
const LIGHT = '#f3d2ab';
const INK = '#2d2420';

export function DancingBear({ dancing = true, beat = 0.44, className = '' }: { dancing?: boolean; beat?: number; className?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={`gb ${dancing ? 'gb-on' : ''} ${className}`} style={{ ['--beat' as string]: `${beat}s`, overflow: 'visible' }} aria-hidden>
      <style>{CSS}</style>
      <g className="gb-all">
        {/* chân */}
        <g className="gb-leg-l"><ellipse cx="78" cy="208" rx="24" ry="18" fill={DARK} /><ellipse cx="78" cy="212" rx="12" ry="9" fill={LIGHT} /></g>
        <g className="gb-leg-r"><ellipse cx="122" cy="208" rx="24" ry="18" fill={DARK} /><ellipse cx="122" cy="212" rx="12" ry="9" fill={LIGHT} /></g>
        {/* tay (đặt sau thân) */}
        <g className="gb-arm-l"><rect x="44" y="124" width="26" height="58" rx="13" fill={DARK} /><circle cx="57" cy="176" r="11" fill={LIGHT} /></g>
        <g className="gb-arm-r"><rect x="130" y="124" width="26" height="58" rx="13" fill={DARK} /><circle cx="143" cy="176" r="11" fill={LIGHT} /></g>
        {/* thân + bụng */}
        <ellipse cx="100" cy="162" rx="50" ry="48" fill={FUR} />
        <ellipse cx="100" cy="172" rx="31" ry="30" fill={LIGHT} />
        {/* nơ đỏ */}
        <path d="M100 122 L80 112 L80 132 Z M100 122 L120 112 L120 132 Z" fill="#e0547b" />
        <circle cx="100" cy="122" r="6" fill="#c23d63" />
        {/* đầu */}
        <g className="gb-head">
          <circle cx="62" cy="40" r="18" fill={DARK} /><circle cx="62" cy="40" r="9" fill="#ebb88d" />
          <circle cx="138" cy="40" r="18" fill={DARK} /><circle cx="138" cy="40" r="9" fill="#ebb88d" />
          <circle cx="100" cy="72" r="46" fill={FUR} />
          <ellipse cx="100" cy="89" rx="21" ry="16" fill={LIGHT} />
          <path d="M77 64 Q83 57 89 64" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M111 64 Q117 57 123 64" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <ellipse cx="100" cy="82" rx="8" ry="6" fill={INK} />
          <path d="M90 92 Q100 104 110 92 Z" fill="#c2414f" />
          <circle cx="72" cy="84" r="7" fill="#f08a8a" opacity=".6" />
          <circle cx="128" cy="84" r="7" fill="#f08a8a" opacity=".6" />
        </g>
      </g>
    </svg>
  );
}
