// Đo hơi thổi của bé qua micro (trò "Tập thổi").
// Tiếng thổi vào micro là tiếng ồn phổ rộng, nặng ở dải trầm (gió đập vào màng micro), khác giọng nói
// (có các họa âm rõ). Nên mỗi khung hình đo: độ to so với tiếng ồn nền × độ "phẳng" của phổ / tỉ lệ dải trầm.
// Kết quả là cường độ 0..1 đã làm mượt (lên nhanh, xuống chậm). Không thu, không lưu gì.
import { openMic, rms, type MicError } from './mic';
import { isSpeaking } from './voice';

export interface Breath {
  /** Cường độ thổi hiện tại 0..1 (gọi mỗi khung hình). */
  level: () => number;
  close: () => void;
}

const FFT = 1024;
/** Mấy trăm mili-giây đầu chỉ đo tiếng ồn nền. */
const CALIBRATE_MS = 450;
/** Tiếng ồn nền tối thiểu/tối đa (RMS). Trần để bé lỡ thổi ngay từ đầu thì vẫn nhận ra. */
const FLOOR_MIN = 0.002;
const FLOOR_MAX = 0.02;
/** Cao hơn nền bao nhiêu dB thì bắt đầu tính, và bao nhiêu thì là "thổi hết sức". */
const DB_START = 8;
const DB_FULL = 32;
/** Thời gian làm mượt (giây): lên nhanh, xuống chậm cho chong chóng quay đà. */
const ATTACK = 0.08;
const RELEASE = 0.35;
/** Tiếng thổi kéo dài đều; tiếng gõ, tiếng "bụp", đầu tiếng nói chỉ thoáng qua. Phải giữ được chừng này giây mới tính. */
const STEADY = 0.15;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Mở micro để đo hơi thổi. Tắt lọc ồn của máy (bộ lọc sẽ xóa mất tiếng thổi). */
export async function openBreath(): Promise<Breath | MicError> {
  const mic = await openMic(false);
  if (typeof mic === 'string') return mic;
  const { ctx, src } = mic;
  const an = ctx.createAnalyser();
  an.fftSize = FFT;
  an.smoothingTimeConstant = 0.3;
  src.connect(an);

  const wave = new Float32Array(FFT);
  const spec = new Float32Array(FFT / 2);
  const binHz = ctx.sampleRate / FFT;
  const bin = (hz: number) => Math.max(1, Math.min(spec.length - 1, Math.round(hz / binHz)));
  const LOW_A = bin(40), LOW_B = bin(800), FLAT_A = bin(150), FLAT_B = bin(4000), ALL_B = bin(8000);

  const t0 = performance.now();
  let last = t0;
  let floor = FLOOR_MAX;
  let calibrated = false;
  let out = 0;
  let steady = 0;

  /** Độ "giống tiếng gió" 0..1: phổ phẳng (nhiễu) hoặc dồn hẳn về dải trầm. */
  function noisiness(): number {
    an.getFloatFrequencyData(spec);
    let logSum = 0, sum = 0, low = 0, all = 0;
    for (let i = LOW_A; i <= ALL_B; i++) {
      const p = 10 ** (Math.max(-120, spec[i]) / 10);
      if (i >= FLAT_A && i <= FLAT_B) { logSum += Math.log(p); sum += p; }
      if (i <= LOW_B) low += p;
      all += p;
    }
    const n = FLAT_B - FLAT_A + 1;
    const flatness = sum > 0 ? Math.exp(logSum / n) / (sum / n) : 0;
    const lowRatio = all > 0 ? low / all : 0;
    return Math.max(clamp01((flatness - 0.1) / 0.25), flatness > 0.1 ? clamp01((lowRatio - 0.5) / 0.3) : 0);
  }

  return {
    level: () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      an.getFloatTimeDomainData(wave);
      const r = rms(wave);

      if (!calibrated) {
        // Lấy mức nhỏ nhất trong lúc hiệu chỉnh (lỡ bé thổi luôn thì không bị tính là nền).
        floor = Math.min(floor, Math.max(FLOOR_MIN, r));
        if (now - t0 < CALIBRATE_MS) return 0;
        calibrated = true;
      }

      const db = 20 * Math.log10(Math.max(r, 1e-6) / floor);
      const loud = clamp01((db - DB_START) / (DB_FULL - DB_START));
      // Nền thay đổi (bật quạt, tắt tivi): cập nhật chậm khi không ai thổi.
      if (loud === 0) floor = Math.min(FLOOR_MAX, Math.max(FLOOR_MIN, floor * 0.98 + r * 0.02));

      // Lúc app đang nói thì micro nghe thấy loa, không tính.
      let raw = isSpeaking() ? 0 : loud * noisiness();
      steady = raw >= 0.05 ? steady + dt : 0;
      if (steady < STEADY) raw = 0;
      const k = 1 - Math.exp(-dt / (raw > out ? ATTACK : RELEASE));
      out += (raw - out) * k;
      return out < 0.01 ? 0 : out;
    },
    close: () => {
      try { an.disconnect(); } catch { /* đã ngắt */ }
      mic.stop();
    },
  };
}
