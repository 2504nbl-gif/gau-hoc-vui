import { useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import { GameScreen } from '@/components/game/GameScreen';
import { useGameSession } from '@/components/game/useGameSession';
import { aimAt } from '@/components/game/Fireworks';
import { Emoji } from '@/components/content/Emoji';
import { PHRASES } from '@/data/phrases';
import { openBreath, type Breath } from '@/services/audio/breath';
import { feedbackCorrect } from '@/services/audio/feedback';
import { duckMusic } from '@/services/audio/music';
import { isSpeaking, preloadVoice, say, stopVoice } from '@/services/audio/voice';
import { sfx } from '@/services/audio/sfx';

/** Những gì cảnh nhận mỗi khung hình. */
export interface SceneProps {
  /** Cường độ thổi lúc này 0..1. */
  level: number;
  /** Tiến độ lượt này 0..1 (đủ gió = 1). */
  wind: number;
  /** Tổng lượng đã thổi từ đầu (không giới hạn) — để quay chong chóng, sinh bong bóng… */
  blown: number;
  done: boolean;
  round: number;
  /** Cảnh tự báo xong (khi `custom`). */
  finish: () => void;
}

type MicState = 'asking' | 'on' | 'denied' | 'unsupported';

/** Độ mạnh của nút "thổi giúp" khi giữ ngón tay. */
const HELP_LEVEL = 0.8;

/**
 * Khung chung cho các trò "Tập thổi": mở micro đo hơi thổi (hoặc giữ nút gió), cộng dồn "lượng gió",
 * đủ thì khen và sang lượt. Mỗi trò chỉ khác cảnh (`Scene`).
 */
export function BlowGame({
  id, title, color, hint, donePhrase, goal, rounds = 3, custom, Scene,
  onExit,
}: {
  id: string;
  title: string;
  color: string;
  hint: string;
  donePhrase: string;
  /** Số giây thổi vừa sức (cường độ 1) cho lượt đầu; các lượt sau dài hơn chút. */
  goal: number;
  rounds?: number;
  /** Cảnh tự quyết khi nào xong (gọi finish), không dùng thanh gió. */
  custom?: boolean;
  Scene: ComponentType<SceneProps>;
  onExit: () => void;
}) {
  const s = useGameSession({ resultId: id, rounds });
  const [mic, setMic] = useState<MicState>('asking');
  const [frame, setFrame] = useState({ level: 0, wind: 0, blown: 0 });
  const frameRef = useRef(frame);
  const [done, setDone] = useState(false);
  const breath = useRef<Breath | null>(null);
  const held = useRef(false);
  const doneRef = useRef(false);
  const stage = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const sRef = useRef(s);
  sRef.current = s;

  const startMic = async () => {
    if (breath.current) return;
    setMic('asking');
    const r = await openBreath();
    if (!alive.current) { if (typeof r !== 'string') r.close(); return; }
    if (typeof r === 'string') { setMic(r); say(PHRASES.blowNoMic); return; }
    breath.current = r;
    setMic('on');
  };

  // Mở micro một lần khi vào trò; ra khỏi trò thì tắt hẳn.
  useEffect(() => {
    alive.current = true;
    void startMic();
    return () => {
      alive.current = false;
      breath.current?.close();
      breath.current = null;
      duckMusic(false);
      stopVoice();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { duckMusic(mic === 'on'); }, [mic]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    const r = stage.current?.getBoundingClientRect();
    if (r) aimAt(r.left + r.width / 2, r.top + r.height * 0.4);
    void feedbackCorrect(donePhrase).done.then(() => window.setTimeout(() => sRef.current.win(), 700));
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Mỗi lượt mới: nói hướng dẫn, xóa tiến độ.
  useEffect(() => {
    doneRef.current = false;
    setDone(false);
    frameRef.current = { ...frameRef.current, wind: 0 };
    setFrame(frameRef.current);
    let cancelled = false;
    preloadVoice([hint, PHRASES.blowHint, PHRASES.blowMore, donePhrase], 'vi').then(() => {
      if (!cancelled) say(s.round === 0 ? hint : PHRASES.blowHint);
    });
    return () => { cancelled = true; };
  }, [s.round, s.game]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vòng khung hình: đọc micro + nút gió, cộng dồn gió, nhắc khi bé ngừng thổi.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let help = 0;
    let lastBlow = last;
    let lastNag = last;
    const goalS = goal * (1 + 0.35 * s.round);
    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      help += ((held.current ? HELP_LEVEL : 0) - help) * (1 - Math.exp(-dt / (held.current ? 0.12 : 0.3)));
      if (help < 0.01) help = 0;
      const level = Math.max(breath.current?.level() ?? 0, help);
      if (level > 0.1) lastBlow = now;
      const f = frameRef.current;
      if (level > 0 || f.level > 0) {
        const wind = doneRef.current || custom ? f.wind : Math.min(1, f.wind + (level > 0.1 ? level : 0) * dt / goalS);
        frameRef.current = { level, wind, blown: f.blown + level * dt };
        setFrame(frameRef.current);
      }
      if (!doneRef.current) {
        // Thổi dở rồi ngừng → cổ vũ (không nói đè lên câu khác).
        if (now - lastBlow > 4500 && now - lastNag > 9000 && !isSpeaking()) { lastNag = now; say(PHRASES.blowMore); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [s.round, s.game, goal, custom]);

  useEffect(() => { if (!custom && frame.wind >= 1) finishRef.current(); }, [frame.wind, custom]);

  const press = (on: boolean) => () => { held.current = on; if (on) sfx.tap(); };
  const blocked = mic === 'denied' || mic === 'unsupported';

  return (
    <GameScreen title={title} color={color} session={s} rounds={rounds} onExit={onExit} onReplay={() => say(hint)}>
      <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] bg-paper shadow-[0_5px_0_var(--color-line)]">
        <Scene level={frame.level} wind={frame.wind} blown={frame.blown} done={done} round={s.round} finish={() => finishRef.current()} />

        {/* Luồng gió bay vào từ trái, đậm theo hơi thổi */}
        <svg viewBox="0 0 200 120" className="pointer-events-none absolute top-[18%] left-0 h-[46%]" style={{ opacity: Math.min(1, frame.level * 1.6) }} aria-hidden>
          {[30, 60, 90].map((y, i) => (
            <path key={y} d={`M0 ${y} q50 -14 100 0 t100 0`} fill="none" stroke="#9fd3f5" strokeWidth="7" strokeLinecap="round" strokeDasharray="40 60">
              <animate attributeName="stroke-dashoffset" from="100" to="0" dur={`${0.5 + i * 0.12}s`} repeatCount="indefinite" />
            </path>
          ))}
        </svg>

        {/* Đèn micro: đang nghe + mức hơi */}
        <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-paper/90 px-3 py-1.5 text-sm font-extrabold text-soft shadow-[0_3px_0_var(--color-line)]">
          <span aria-hidden>{blocked ? '🔇' : '🎤'}</span>
          <span className="h-3 w-20 overflow-hidden rounded-full bg-line">
            <span className="block h-full rounded-full bg-sea transition-[width] duration-75" style={{ width: `${frame.level * 100}%` }} />
          </span>
        </div>

        {blocked && (
          <p role="status" className="absolute top-14 left-3 z-10 m-0 max-w-[36ch] rounded-2xl bg-paper/95 px-3 py-2 text-sm font-bold text-soft shadow-[0_3px_0_var(--color-line)]">
            {mic === 'denied'
              ? 'Bố mẹ ơi: trình duyệt đang chặn micro. Chạm biểu tượng ổ khóa cạnh địa chỉ trang → cho phép Micro, rồi chạm 🔄. Chưa bật được thì bé giữ nút gió để thổi.'
              : 'Bố mẹ ơi: máy chưa có micro (hoặc trang chưa mở qua https). Bé giữ nút gió để thổi nhé.'}
            {mic === 'denied' && (
              <button onClick={() => { sfx.tap(); void startMic(); }} className="press ml-2 rounded-xl px-2 py-0.5" style={{ '--c': 'var(--color-sea)' } as CSSProperties} aria-label="Thử lại micro">🔄</button>
            )}
          </p>
        )}

        {/* Thanh gió: đầy là xong lượt */}
        {!custom && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-paper/90 p-1.5 pr-2 shadow-[0_3px_0_var(--color-line)]" style={{ width: 'min(46%, 380px)' }}>
            <span className="h-5 flex-1 overflow-hidden rounded-full bg-line">
              <span className="block h-full rounded-full" style={{ width: `${frame.wind * 100}%`, background: `var(--color-${color})` }} />
            </span>
            <Emoji glyph="⭐" size="28px" />
          </div>
        )}

        {/* Nút "thổi giúp": giữ ngón tay = thổi */}
        <button
          aria-label="Chạm để thổi giúp"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); press(true)(); }}
          onPointerUp={press(false)} onPointerCancel={press(false)} onLostPointerCapture={press(false)}
          onContextMenu={(e) => e.preventDefault()}
          className="press absolute right-4 bottom-4 flex touch-none flex-col items-center justify-center rounded-full font-display font-extrabold leading-tight"
          style={{ '--c': 'var(--color-sky)', width: 'clamp(96px, 20vh, 140px)', height: 'clamp(96px, 20vh, 140px)' } as CSSProperties}
        >
          <Emoji glyph="🌬️" size="clamp(40px, 9vh, 64px)" />
          <span className="text-[clamp(11px,2vh,15px)]">Chạm để<br />thổi giúp</span>
        </button>
      </div>
    </GameScreen>
  );
}
