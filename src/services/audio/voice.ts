// Giọng đọc của cô giáo.
// Thứ tự ưu tiên: 1) file thu riêng của thẻ (item.audio)  2) gói giọng thu sẵn  3) giọng của máy (Web Speech).
import type { Lang, VocabItem } from '@/types/content';
import { spokenText } from '@/data';
import { PHRASES } from '@/data/phrases';
import { audioCtx, isLoaded, loadBuffer, playSegment, voiceSegmentsPlaying, voiceVolume, type Segment } from './AudioManager';
import { findClip, packReady, type WordTimes } from './voicePack';

export interface SayOptions {
  /** Gọi khi chữ thứ i (theo text.split(' ')) bắt đầu được đọc. Dùng cho karaoke. */
  onWord?: (i: number) => void;
}

export interface Playback {
  /** Xong khi đọc hết hoặc bị dừng. `true` = đọc hết. */
  done: Promise<boolean>;
  stop: () => void;
}

// ── Web Speech (dự phòng) ─────────────────────────────────────
const synth: SpeechSynthesis | null = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
const LOCALE: Record<Lang, string> = { vi: 'vi-VN', en: 'en-US' };
let voices: SpeechSynthesisVoice[] = [];
const loadVoices = () => { if (synth) voices = synth.getVoices(); };
loadVoices();
synth?.addEventListener?.('voiceschanged', loadVoices);
const deviceVoice = (lang: Lang) => voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(lang));

/** Ước lượng mốc chữ khi không có gói giọng: mỗi chữ ~0,38 giây, thêm nghỉ ở dấu câu. */
function estimateWords(text: string): WordTimes {
  let t = 0;
  return text.split(' ').map((w) => {
    const d = 0.3 + Math.min(0.25, w.length * 0.02);
    const span: [number, number] = [t, t + d];
    t += d + (/[,.:;!?]$/.test(w) ? 0.3 : 0.04);
    return span;
  });
}

// ── Đồng bộ chữ theo đồng hồ ─────────────────────────────────
function trackWords(words: WordTimes, now: () => number, onWord: (i: number) => void): () => void {
  let last = -1;
  let raf = 0;
  const tick = () => {
    const t = now();
    let i = last;
    while (i + 1 < words.length && t >= words[i + 1][0]) i++;
    if (i !== last) { last = i; onWord(i); }
    if (last < words.length - 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

let current: Playback | null = null;
let currentAudioEl: HTMLAudioElement | null = null;

export function stopVoice() {
  current?.stop();
  current = null;
  synth?.cancel();
  currentAudioEl?.pause();
  currentAudioEl = null;
}

/** Cô có đang đọc không (gói giọng, giọng máy hoặc file riêng). Nhạc nền dùng để tự hạ âm lượng. */
export const isSpeaking = () =>
  voiceSegmentsPlaying() || Boolean(synth?.speaking) || Boolean(currentAudioEl && !currentAudioEl.paused && !currentAudioEl.ended);

function sayWithDevice(text: string, lang: Lang, opts: SayOptions): Playback {
  let resolve!: (v: boolean) => void;
  const done = new Promise<boolean>((r) => (resolve = r));
  if (!synth) { resolve(true); return { done, stop: () => {} }; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LOCALE[lang];
  const v = deviceVoice(lang);
  if (v) u.voice = v;
  u.rate = lang === 'vi' ? 0.85 : 0.8;
  u.pitch = 1.1;
  u.volume = voiceVolume();
  let untrack = () => {};
  let gotBoundary = false;
  const words = text.split(' ');
  if (opts.onWord) {
    const onWord = opts.onWord;
    u.onstart = () => {
      const t0 = performance.now();
      untrack = trackWords(estimateWords(text), () => (gotBoundary ? -1 : (performance.now() - t0) / 1000), onWord);
    };
    // Máy nào báo được ranh giới chữ thì dùng mốc thật.
    u.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      gotBoundary = true;
      untrack();
      let pos = 0;
      const i = words.findIndex((w) => { const end = pos + w.length; const hit = e.charIndex < end; pos = end + 1; return hit; });
      if (i >= 0) onWord(i);
    };
  }
  const finish = (ok: boolean) => { untrack(); resolve(ok); };
  u.onend = () => finish(true);
  u.onerror = () => finish(false);
  synth.cancel();
  synth.speak(u);
  return { done, stop: () => { synth.cancel(); finish(false); } };
}

/** Đọc một câu. Câu mới luôn ngắt câu đang đọc. */
export function say(text: string, lang: Lang = 'vi', opts: SayOptions = {}): Playback {
  stopVoice();
  const clip = lang === 'vi' ? findClip(text) : null;
  if (!clip || !audioCtx()) return (current = sayWithDevice(text, lang, opts));

  let stopped = false;
  let seg: Segment | null = null;
  let untrack = () => {};
  const done = (async () => {
    const buf = await loadBuffer(clip.url).catch(() => null);
    if (stopped) return false;
    if (!buf) return sayWithDevice(text, lang, opts).done; // file lỗi → giọng máy
    seg = playSegment(buf, clip.offset, clip.duration);
    if (opts.onWord) {
      const c = audioCtx()!;
      const s = seg.startedAt;
      untrack = trackWords(clip.words ?? estimateWords(text), () => c.currentTime - s, opts.onWord);
    }
    await seg.ended;
    untrack();
    return !stopped;
  })();
  const pb: Playback = { done, stop: () => { stopped = true; seg?.stop(); untrack(); } };
  current = pb;
  return pb;
}

/**
 * Tải trước âm thanh cho danh sách câu (vd 10 thẻ của phiên tráo).
 * Trả về số câu có giọng thu sẵn; câu còn lại sẽ dùng giọng máy.
 */
export async function preloadVoice(texts: string[], lang: Lang, onProgress?: (p: number) => void): Promise<number> {
  await packReady;
  if (lang !== 'vi') { onProgress?.(1); return 0; }
  const clips = texts.map((t) => findClip(t)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const urls = [...new Set(clips.map((c) => c.url))];
  let done = urls.filter(isLoaded).length;
  onProgress?.(urls.length ? done / urls.length : 1);
  await Promise.all(urls.filter((u) => !isLoaded(u)).map((u) =>
    loadBuffer(u).catch(() => null).finally(() => { done++; onProgress?.(done / urls.length); })));
  return clips.length;
}

/** Đọc tên một thẻ. Trả về Playback để biết lúc đọc xong. */
export function speakItem(item: VocabItem, lang: Lang): Playback {
  const file = item.audio?.[lang];
  if (!file) return say(spokenText(item, lang), lang);
  stopVoice();
  const el = new Audio(file);
  el.volume = voiceVolume();
  currentAudioEl = el;
  const done = new Promise<boolean>((res) => {
    el.onended = () => res(true);
    el.play().catch(() => say(spokenText(item, lang), lang).done.then(res));
  });
  return { done, stop: () => el.pause() };
}

const PRAISE_EN = ['Great job!', 'Awesome!', 'Well done!', 'Super!'];
export const praise = (lang: Lang) => {
  const list = lang === 'vi' ? PHRASES.praise : PRAISE_EN;
  say(list[Math.floor(Math.random() * list.length)], lang);
};

/** Nguồn giọng đang dùng cho ngôn ngữ, để hiện trong cài đặt. */
export async function voiceSource(lang: Lang): Promise<'pack' | 'device' | 'none'> {
  if (lang === 'vi' && (await packReady)) return 'pack';
  return deviceVoice(lang) ? 'device' : 'none';
}

/**
 * Đọc nối tiếp nhiều mảnh câu, vd ["Bé tìm", "Con mèo"].
 * Mảnh nào chưa có trong gói giọng thì đọc cả câu bằng giọng máy cho liền mạch.
 */
export function sayAll(parts: string[], lang: Lang = 'vi'): Playback {
  if (lang !== 'vi' || parts.some((p) => !findClip(p))) return say(parts.join(' '), lang);
  stopVoice();
  let stopped = false;
  let cur: Playback | null = null;
  const pb: Playback = { done: Promise.resolve(false), stop: () => { stopped = true; cur?.stop(); } };
  pb.done = (async () => {
    for (const part of parts) {
      if (stopped) return false;
      current = null;      // say() luôn dừng "câu hiện tại" — không được dừng chính chuỗi này
      cur = say(part, lang);
      current = pb;
      if (!(await cur.done)) return false;
      await new Promise((r) => setTimeout(r, 60));
    }
    return !stopped;
  })();
  current = pb;
  return pb;
}
