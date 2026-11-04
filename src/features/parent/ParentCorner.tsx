import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { TopBar } from '@/components/ui/TopBar';
import { Segmented } from '@/components/ui/Segmented';
import { PressButton } from '@/components/ui/PressButton';
import { TOPICS, getTopic } from '@/data';
import { GAME_META } from '@/data/gameList';
import { DEFAULT_CHILD, PHRASES } from '@/data/phrases';
import { useNav } from '@/store/useNav';
import { dayKey, useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore, type VoiceId } from '@/store/useSettingsStore';
import { say } from '@/services/audio/voice';
import { packAvailable } from '@/services/audio/voicePack';
import { sfx } from '@/services/audio/sfx';

/** Màn hình cho bố mẹ (chữ để người lớn đọc, không có giọng): báo cáo + cài đặt. */
export function ParentCorner() {
  const go = useNav((s) => s.go);
  const [tab, setTab] = useState<'report' | 'settings' | 'family'>('report');
  return (
    <main className="room overflow-y-auto" style={{ '--c': 'var(--color-sea)' } as CSSProperties}>
      <TopBar
        title="Góc phụ huynh"
        onBack={() => go({ name: 'dashboard' })}
        right={<Segmented label="Mục" value={tab} onChange={(v) => (v === 'family' ? go({ name: 'family-photos' }) : setTab(v))} options={[{ value: 'report', label: 'Báo cáo' }, { value: 'settings', label: 'Cài đặt' }, { value: 'family', label: 'Ảnh gia đình' }]} />}
      />
      {tab === 'report' ? <Report /> : <Settings />}
    </main>
  );
}

// ── Khung dùng chung ─────────────────────────────────────────
const Card = ({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) => (
  <section className={`rounded-[24px] bg-paper p-4 shadow-[0_4px_0_var(--color-line)] ${className}`}>
    <h2 className="m-0 mb-3 font-display text-xl font-extrabold">{title}</h2>
    {children}
  </section>
);
const Stat = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-2xl bg-cloud px-4 py-3">
    <div className="font-display text-3xl font-extrabold tabular-nums">{value}</div>
    <div className="text-sm font-bold text-soft">{label}</div>
  </div>
);
const minutes = (s: number) => Math.round(s / 60);
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// ── Báo cáo ──────────────────────────────────────────────────
/** Tên dễ đọc cho id kết quả, vd "listen-find-pets" → "Nghe và tìm · Thú cưng". */
function gameLabel(id: string): string {
  const exact = GAME_META.find((g) => g.id === id);
  if (exact) return exact.title;
  const [prefix, rest] =
    id.startsWith('scene-') ? [id.slice(6), ''] :
    id.startsWith('magnifier-') ? ['Kính lúp', id.slice(10)] :
    [id, ''];
  if (prefix === 'Kính lúp') return `Kính lúp · ${getTopic(rest.replace(/-\d+$/, ''))?.title.vi ?? rest}`;
  const meta = GAME_META.find((g) => g.id === prefix) ?? GAME_META.filter((g) => prefix.startsWith(g.id)).sort((a, b) => b.id.length - a.id.length)[0];
  if (!meta) return id;
  const tail = (rest || prefix.slice(meta.id.length)).replace(/^-/, '');
  return tail ? `${meta.title} · ${getTopic(tail)?.title.vi ?? tail}` : meta.title;
}

function Report() {
  const { stars, daily, flashcardViews, gameStats, gameResults } = useProgressStore();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const log = daily[dayKey(d)] ?? { plays: 0, seconds: 0, stars: 0 };
    return { label: i === 6 ? 'Hôm nay' : WEEKDAY[d.getDay()], ...log };
  });
  const maxSec = Math.max(60, ...days.map((d) => d.seconds));
  const weekSec = days.reduce((a, d) => a + d.seconds, 0);
  const weekPlays = days.reduce((a, d) => a + d.plays, 0);

  const topics = TOPICS.map((t) => ({ title: t.title.vi, views: flashcardViews[t.id] ?? 0 })).sort((a, b) => b.views - a.views);
  const most = topics.filter((t) => t.views > 0).slice(0, 5);
  const least = [...topics].reverse().slice(0, 5);

  const games = Object.entries(gameStats)
    .map(([id, g]) => ({ id, ...g, best: gameResults[id] ?? 0 }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 8);

  return (
    <div className="grid gap-3 pb-4 lg:grid-cols-2">
      <Card title="Tổng quan" className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Tổng sao" value={`⭐ ${stars}`} />
          <Stat label="Phút hôm nay" value={minutes(days[6].seconds)} />
          <Stat label="Phút 7 ngày" value={minutes(weekSec)} />
          <Stat label="Lượt học 7 ngày" value={weekPlays} />
        </div>
      </Card>

      <Card title="7 ngày gần nhất" className="lg:col-span-2">
        <div className="flex h-44 items-end gap-2" role="img" aria-label={days.map((d) => `${d.label}: ${minutes(d.seconds)} phút, ${d.plays} lượt`).join('; ')}>
          {days.map((d, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-sm font-extrabold tabular-nums">{minutes(d.seconds)}′</span>
              <div className="w-full max-w-14 rounded-t-xl bg-sea" style={{ height: `${(d.seconds / maxSec) * 100}%`, minHeight: 3, opacity: i === 6 ? 1 : 0.7 }} />
              <span className="text-xs font-bold whitespace-nowrap text-soft">{d.label}</span>
              <span className="text-xs font-bold text-soft tabular-nums">{d.plays} lượt</span>
            </div>
          ))}
        </div>
        <p className="mt-2 mb-0 text-sm font-bold text-soft">Cột: số phút đang mở app. Lượt: số bài làm xong (tráo thẻ, trò chơi, truyện…).</p>
      </Card>

      <Card title="Chủ đề tráo thẻ">
        <h3 className="m-0 mb-1 text-base font-extrabold text-leaf">Xem nhiều</h3>
        {most.length ? (
          <ul className="m-0 mb-3 list-none p-0">
            {most.map((t) => <li key={t.title} className="flex justify-between border-b border-line py-1 font-bold"><span>{t.title}</span><span className="tabular-nums text-soft">{t.views} lần</span></li>)}
          </ul>
        ) : <p className="m-0 mb-3 font-bold text-soft">Chưa xem chủ đề nào.</p>}
        <h3 className="m-0 mb-1 text-base font-extrabold text-coral">Xem ít (nên cho bé xem thêm)</h3>
        <ul className="m-0 list-none p-0">
          {least.map((t) => <li key={t.title} className="flex justify-between border-b border-line py-1 font-bold"><span>{t.title}</span><span className="tabular-nums text-soft">{t.views} lần</span></li>)}
        </ul>
      </Card>

      <Card title="Trò chơi">
        {games.length ? (
          <table className="w-full border-collapse text-left font-bold">
            <thead>
              <tr className="text-sm text-soft">
                <th className="py-1 font-bold">Trò</th>
                <th className="py-1 text-right font-bold">Lượt</th>
                <th className="py-1 text-right font-bold">Đúng ngay</th>
                <th className="py-1 text-right font-bold">Cao nhất</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <tr key={g.id} className="border-t border-line">
                  <td className="py-1.5">{gameLabel(g.id)}</td>
                  <td className="py-1.5 text-right tabular-nums">{g.plays}</td>
                  <td className="py-1.5 text-right tabular-nums">{g.total ? `${Math.round((g.correct / g.total) * 100)}%` : '—'}</td>
                  <td className="py-1.5 text-right">{'⭐'.repeat(g.best)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="m-0 font-bold text-soft">Bé chưa chơi xong trò nào.</p>}
        <p className="mt-2 mb-0 text-sm font-bold text-soft">"Đúng ngay": tỉ lệ câu bé chọn đúng từ lần đầu.</p>
      </Card>
    </div>
  );
}

// ── Cài đặt ──────────────────────────────────────────────────
const Row = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line py-3 last:border-0">
    <div className="min-w-[180px] flex-1">
      <div className="font-extrabold">{label}</div>
      {hint && <div className="text-sm font-bold text-soft">{hint}</div>}
    </div>
    <div className="flex flex-wrap items-center gap-3">{children}</div>
  </div>
);

const Slider = ({ value, onChange, label, disabled }: { value: number; onChange: (v: number) => void; label: string; disabled?: boolean }) => (
  <label className="flex items-center gap-2 font-bold">
    <input
      type="range" min={0} max={100} step={5} aria-label={label} disabled={disabled}
      value={Math.round(value * 100)}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      className="w-48 accent-[var(--color-sea)] disabled:opacity-40"
    />
    <span className="w-12 tabular-nums">{Math.round(value * 100)}%</span>
  </label>
);

const VOICES: { id: VoiceId; label: string; missing?: string }[] = [
  { id: 'bo', label: 'Bố', missing: 'chưa có — cần tạo gói giọng' },
  { id: 'me', label: 'Mẹ', missing: 'chưa có — cần ghi âm của mẹ' },
  { id: 'may', label: 'Giọng máy' },
];
const LIMITS = [0, 15, 20, 30, 45, 60];

function Settings() {
  const st = useSettingsStore();
  const { childName, setChildName } = useProgressStore();
  const today = useProgressStore((s) => s.daily[dayKey()]?.seconds ?? 0);
  const [name, setName] = useState(childName);
  const [have, setHave] = useState<Record<VoiceId, boolean>>({ bo: true, me: false, may: true });

  useEffect(() => {
    let off = false;
    Promise.all(VOICES.map((v) => packAvailable(v.id))).then((ok) => {
      if (!off) setHave(Object.fromEntries(VOICES.map((v, i) => [v.id, ok[i]])) as Record<VoiceId, boolean>);
    });
    return () => { off = true; };
  }, []);

  const trimmed = name.trim();
  return (
    <div className="grid gap-3 pb-4 lg:grid-cols-2">
      <Card title="Giọng đọc">
        <Row label="Giọng cô giáo" hint="Câu nào chưa có trong gói sẽ đọc bằng giọng máy.">
          <div role="radiogroup" aria-label="Giọng đọc" className="flex flex-wrap gap-2">
            {VOICES.map((v) => {
              const on = st.voice === v.id;
              const ok = have[v.id];
              return (
                <button
                  key={v.id}
                  role="radio"
                  aria-checked={on}
                  disabled={!ok}
                  onClick={() => { sfx.tap(); st.set({ voice: v.id }); }}
                  className={`min-h-11 rounded-xl border-2 px-4 py-1 text-left font-extrabold transition-colors disabled:opacity-45 ${
                    on ? 'border-sea bg-sea text-white' : 'border-line bg-cloud text-ink'
                  }`}
                >
                  {v.label}
                  {!ok && v.missing && <span className="block text-xs font-bold">({v.missing})</span>}
                </button>
              );
            })}
          </div>
        </Row>
        <Row label="Âm lượng giọng">
          <Slider label="Âm lượng giọng" value={st.voiceVolume} onChange={(voiceVolume) => st.set({ voiceVolume })} />
          <PressButton color="sea" onClick={() => say(PHRASES.tryVoice)}>🔊 Nghe thử</PressButton>
        </Row>
      </Card>

      <Card title="Nhạc nền">
        <Row label="Nhạc nền nhẹ" hint="Tự nhỏ lại khi cô đọc, tắt trong trò âm nhạc và đàn.">
          <Segmented label="Nhạc nền" value={st.musicOn ? 'on' : 'off'} onChange={(v) => st.set({ musicOn: v === 'on' })}
            options={[{ value: 'on', label: 'Bật' }, { value: 'off', label: 'Tắt' }]} />
        </Row>
        <Row label="Âm lượng nhạc">
          <Slider label="Âm lượng nhạc" value={st.musicVolume} disabled={!st.musicOn} onChange={(musicVolume) => st.set({ musicVolume })} />
        </Row>
      </Card>

      <Card title="Thời gian chơi">
        <Row label="Giới hạn mỗi ngày" hint={`Hôm nay đã chơi ${minutes(today)} phút. Hết giờ, app hiện màn "Gấu đi ngủ rồi".`}>
          <Segmented label="Giới hạn mỗi ngày" value={st.dailyLimitMin} onChange={(dailyLimitMin) => st.set({ dailyLimitMin })}
            options={LIMITS.map((m) => ({ value: m, label: m ? `${m} phút` : 'Không giới hạn' }))} />
        </Row>
      </Card>

      <Card title="Tên bé">
        <Row label="Cô gọi bé là" hint={`Tên khác "${DEFAULT_CHILD}" thì câu có tên sẽ đọc bằng giọng máy.`}>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (trimmed) { setChildName(trimmed); sfx.select(); } }}>
            <input
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
              aria-label="Tên bé"
              className="h-12 w-44 rounded-xl border-2 border-line bg-cloud px-3 text-lg font-extrabold outline-none focus:border-sea"
            />
            <PressButton type="submit" color="leaf" disabled={!trimmed || trimmed === childName}>Lưu</PressButton>
          </form>
        </Row>
      </Card>
    </div>
  );
}
