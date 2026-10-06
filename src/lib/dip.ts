export type FilterId = "none" | "canny" | "sobel" | "prewitt" | "otsu";

export interface Calibration {
  exposure: number; // EV, -2..+2
  brightness: number; // %, 50..150
  contrast: number; // %, 50..150
}
export interface FilterParams {
  sigma: number;
  low: number;
  high: number;
  tint: [number, number, number];
}

export const DEFAULT_CALIBRATION: Calibration = { exposure: 0, brightness: 100, contrast: 100 };
export const DEFAULT_PARAMS: FilterParams = { sigma: 1.4, low: 15, high: 40, tint: [173, 198, 255] };

const SOBEL_X = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
const SOBEL_Y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
const PREWITT_X = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]];
const PREWITT_Y = [[-1, -1, -1], [0, 0, 0], [1, 1, 1]];

/** Exposure, brightness, contrast langsung pada piksel (in-place). */
export function calibrate(img: ImageData, c: Calibration): void {
  const gain = (2 ** c.exposure * c.brightness) / 100;
  const k = c.contrast / 100;
  const p = img.data;
  for (let i = 0; i < p.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) p[i + ch] = (p[i + ch] * gain - 128) * k + 128; // Uint8ClampedArray meng-clamp
  }
}

/** Y = 0.299R + 0.587G + 0.114B */
export function toGray(img: ImageData): Float32Array {
  const n = img.width * img.height;
  const g = new Float32Array(n);
  const p = img.data;
  for (let i = 0; i < n; i++) g[i] = 0.299 * p[i * 4] + 0.587 * p[i * 4 + 1] + 0.114 * p[i * 4 + 2];
  return g;
}

export function histogram(g: Float32Array): number[] {
  const h = new Array<number>(256).fill(0);
  for (let i = 0; i < g.length; i++) h[Math.max(0, Math.min(255, g[i] | 0))]++;
  return h;
}

/** Konvolusi 3×3, border direplikasi (clamp). */
export function convolve3(g: Float32Array, w: number, h: number, k: number[][], div = 1): Float32Array {
  const out = new Float32Array(g.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let j = -1; j <= 1; j++) {
        const yy = Math.min(h - 1, Math.max(0, y + j));
        for (let i = -1; i <= 1; i++) {
          const xx = Math.min(w - 1, Math.max(0, x + i));
          s += k[j + 1][i + 1] * g[yy * w + xx];
        }
      }
      out[y * w + x] = s / div;
    }
  }
  return out;
}

/** Gaussian blur separable dengan radius ceil(3σ). */
export function gaussian(g: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const r = Math.max(1, Math.ceil(3 * sigma));
  const k = new Float32Array(2 * r + 1);
  let sum = 0;
  for (let i = -r; i <= r; i++) sum += k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma));
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const tmp = new Float32Array(g.length);
  const out = new Float32Array(g.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) s += k[i + r] * g[y * w + Math.min(w - 1, Math.max(0, x + i))];
      tmp[y * w + x] = s;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) s += k[i + r] * tmp[Math.min(h - 1, Math.max(0, y + i)) * w + x];
      out[y * w + x] = s;
    }
  return out;
}

function gradients(g: Float32Array, w: number, h: number, kx: number[][], ky: number[][], norm: number) {
  const gx = convolve3(g, w, h, kx, norm);
  const gy = convolve3(g, w, h, ky, norm);
  const mag = new Float32Array(g.length);
  for (let i = 0; i < mag.length; i++) mag[i] = Math.hypot(gx[i], gy[i]);
  return { gx, gy, mag };
}

/** Canny: Gaussian → Sobel → non-max suppression → double threshold → hysteresis. Hasil 0/255. */
export function canny(g: Float32Array, w: number, h: number, sigma: number, low: number, high: number): Uint8Array {
  const { gx, gy, mag } = gradients(gaussian(g, w, h, sigma), w, h, SOBEL_X, SOBEL_Y, 4);
  const cls = new Uint8Array(g.length); // 0 none, 1 weak, 2 strong
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const m = mag[i];
      if (m < low) continue;
      let a = (Math.atan2(gy[i], gx[i]) * 180) / Math.PI;
      if (a < 0) a += 180;
      let n1: number, n2: number;
      if (a < 22.5 || a >= 157.5) { n1 = mag[i - 1]; n2 = mag[i + 1]; }
      else if (a < 67.5) { n1 = mag[i - w + 1]; n2 = mag[i + w - 1]; }
      else if (a < 112.5) { n1 = mag[i - w]; n2 = mag[i + w]; }
      else { n1 = mag[i - w - 1]; n2 = mag[i + w + 1]; }
      if (m >= n1 && m >= n2) cls[i] = m >= high ? 2 : 1;
    }
  }
  const out = new Uint8Array(g.length);
  const stack: number[] = [];
  for (let i = 0; i < cls.length; i++) if (cls[i] === 2) { out[i] = 255; stack.push(i); }
  while (stack.length) {
    const i = stack.pop()!;
    for (const d of [-w - 1, -w, -w + 1, -1, 1, w - 1, w, w + 1]) {
      const j = i + d;
      if (j >= 0 && j < cls.length && cls[j] === 1 && !out[j]) { out[j] = 255; stack.push(j); }
    }
  }
  return out;
}

/** Ambang optimal Otsu (maksimum varians antar-kelas). */
export function otsu(g: Float32Array): number {
  const hist = histogram(g);
  const total = g.length;
  let sumAll = 0;
  for (let t = 0; t < 256; t++) sumAll += t * hist[t];
  let wB = 0, sumB = 0, best = 0, threshold = 0;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB, mF = (sumAll - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; threshold = t; }
  }
  return threshold;
}

function paint(src: ImageData, values: ArrayLike<number>, tint: [number, number, number]): void {
  const p = src.data;
  for (let i = 0; i < values.length; i++) {
    const v = Math.min(255, values[i]) / 255;
    p[i * 4] = tint[0] * v; p[i * 4 + 1] = tint[1] * v; p[i * 4 + 2] = tint[2] * v; p[i * 4 + 3] = 255;
  }
}

/** Terapkan filter ke ImageData (in-place). Mengembalikan teks info singkat untuk UI. */
export function applyFilter(img: ImageData, id: FilterId, p: FilterParams): string {
  if (id === "none") return "Passthrough";
  const { width: w, height: h } = img;
  const g = toGray(img);
  if (id === "canny") {
    paint(img, canny(g, w, h, p.sigma, p.low, p.high), p.tint);
    return `σ=${p.sigma.toFixed(1)} · T ${p.low}/${p.high}`;
  }
  if (id === "otsu") {
    const t = otsu(g);
    const bin = new Uint8Array(g.length);
    for (let i = 0; i < g.length; i++) bin[i] = g[i] > t ? 255 : 0;
    paint(img, bin, [255, 255, 255]);
    return `Otsu T = ${t}`;
  }
  const sobel = id === "sobel";
  const { mag } = gradients(g, w, h, sobel ? SOBEL_X : PREWITT_X, sobel ? SOBEL_Y : PREWITT_Y, sobel ? 4 : 3);
  paint(img, mag, p.tint);
  return sobel ? "Sobel 3×3 |∇f|" : "Prewitt 3×3 |∇f|";
}
