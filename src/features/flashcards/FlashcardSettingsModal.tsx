import { Modal } from '@/components/ui/Modal';
import { Segmented } from '@/components/ui/Segmented';
import { PressButton } from '@/components/ui/PressButton';
import { useFlashcardStore } from '@/store/useFlashcardStore';
import { FLASHCARD_LIMITS, type CardFace, type CardOrder, type PlayMode } from '@/types/settings';
import type { Lang } from '@/types/content';
import { useEffect, useState } from 'react';
import { say, voiceSource } from '@/services/audio/voice';
import { PHRASES } from '@/data/phrases';

const SOURCE_NOTE = {
  pack: 'Giọng cô giáo thu sẵn, đọc được cả khi không có mạng.',
  device: 'Đang dùng giọng có sẵn của máy.',
  none: 'Máy chưa có giọng cho ngôn ngữ này. Tải thêm trong Cài đặt máy › Trợ năng › Nội dung được đọc.',
};

const Row = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-extrabold uppercase tracking-wider text-soft">{label}</span>
    {children}
    {hint && <p className="m-0 text-sm text-soft">{hint}</p>}
  </div>
);

export function FlashcardSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useFlashcardStore((x) => x.settings);
  const update = useFlashcardStore((x) => x.update);
  const [source, setSource] = useState<keyof typeof SOURCE_NOTE>('pack');
  useEffect(() => { let on = true; voiceSource(s.lang).then((v) => on && setSource(v)); return () => { on = false; }; }, [s.lang]);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <h2 className="m-0 font-display text-2xl font-extrabold">Cài đặt tráo thẻ</h2>

        <Row
          label="Ngôn ngữ"
          hint={SOURCE_NOTE[source]}
        >
          <Segmented<Lang> label="Ngôn ngữ" value={s.lang} onChange={(lang) => update({ lang })}
            options={[{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'Tiếng Anh' }]} />
        </Row>

        <Row label="Loại thẻ">
          <Segmented<CardFace> label="Loại thẻ" value={s.face} onChange={(face) => update({ face })}
            options={[{ value: 'image', label: 'Chỉ hình' }, { value: 'text', label: 'Chỉ chữ' }, { value: 'both', label: 'Hình + chữ' }]} />
        </Row>

        <Row label="Thứ tự thẻ">
          <Segmented<CardOrder> label="Thứ tự thẻ" value={s.order} onChange={(order) => update({ order })}
            options={[{ value: 'shuffle', label: 'Ngẫu nhiên' }, { value: 'fixed', label: 'Theo thứ tự' }]} />
        </Row>

        <Row label="Cách tráo" hint={s.mode === 'manual' ? 'Vuốt hoặc chạm nửa phải màn hình để sang thẻ, nửa trái để quay lại.' : undefined}>
          <Segmented<PlayMode> label="Cách tráo" value={s.mode} onChange={(mode) => update({ mode })}
            options={[{ value: 'auto', label: 'Tự động' }, { value: 'manual', label: 'Bằng tay' }]} />
        </Row>

        {s.mode === 'auto' && (
          <Row label="Tốc độ" hint="1 giây là nhịp chuẩn Glenn Doman. Thẻ chỉ chuyển khi cô đã đọc xong tên, nên tên dài sẽ dừng lâu hơn một chút.">
            <Segmented<number> label="Tốc độ" value={s.intervalMs} onChange={(intervalMs) => update({ intervalMs })}
              options={FLASHCARD_LIMITS.intervals.map((v) => ({ value: v, label: `${(v / 1000).toLocaleString('vi-VN')} giây` }))} />
          </Row>
        )}

        <Row label={`Số thẻ mỗi chủ đề: ${s.cardsPerTopic}`}>
          <input
            id="cards-per-topic"
            type="range"
            min={FLASHCARD_LIMITS.minCards}
            max={FLASHCARD_LIMITS.maxCards}
            value={s.cardsPerTopic}
            onChange={(e) => update({ cardsPerTopic: Number(e.target.value) })}
            className="h-10 w-full accent-coral"
            aria-label="Số thẻ mỗi chủ đề"
          />
        </Row>

        <Row label="Đọc to tên thẻ">
          <Segmented<'on' | 'off'> label="Đọc to" value={s.speak ? 'on' : 'off'} onChange={(v) => update({ speak: v === 'on' })}
            options={[{ value: 'on', label: 'Bật' }, { value: 'off', label: 'Tắt' }]} />
        </Row>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <small className="mr-auto text-xs text-soft">Hình emoji: Microsoft Fluent Emoji (MIT)</small>
          <PressButton variant="ghost" onClick={() => say(s.lang === 'vi' ? PHRASES.tryVoice : 'Cat', s.lang)}>🔊 Thử giọng</PressButton>
          <PressButton color="leaf" onClick={onClose}>Xong</PressButton>
        </div>
      </div>
    </Modal>
  );
}
