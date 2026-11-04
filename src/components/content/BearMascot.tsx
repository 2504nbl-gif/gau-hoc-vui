/** Linh vật gấu của app (vẽ riêng, không dùng nhân vật có bản quyền). */
export function BearMascot({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <circle cx="27" cy="30" r="18" fill="#a8693f" />
      <circle cx="93" cy="30" r="18" fill="#a8693f" />
      <circle cx="27" cy="30" r="9" fill="#ebb88d" />
      <circle cx="93" cy="30" r="9" fill="#ebb88d" />
      <circle cx="60" cy="64" r="46" fill="#b9774a" />
      <ellipse cx="60" cy="81" rx="22" ry="17" fill="#f3d2ab" />
      <circle cx="43" cy="58" r="6" fill="#2d2420" />
      <circle cx="77" cy="58" r="6" fill="#2d2420" />
      <circle cx="45" cy="56" r="2" fill="#fff" />
      <circle cx="79" cy="56" r="2" fill="#fff" />
      <ellipse cx="60" cy="74" rx="8" ry="6" fill="#2d2420" />
      <path d="M52 86 Q60 93 68 86" stroke="#2d2420" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="33" cy="77" r="6" fill="#f08a8a" opacity=".55" />
      <circle cx="87" cy="77" r="6" fill="#f08a8a" opacity=".55" />
    </svg>
  );
}
