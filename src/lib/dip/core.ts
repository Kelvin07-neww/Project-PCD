import { SOBEL_GX, SOBEL_GY, type KernelMatrix } from "../../data/kernels";

/** Gambar RGBA 8-bit (urutan sama dengan ImageData). */
export interface Pixels {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface Histograms {
  r: Uint32Array;
  g: Uint32Array;
  b: Uint32Array;
  y: Uint32Array;
}

export interface ChannelStats {
  mean: number;
  std: number;
  skew: number;
  peak: number;
  min: number;
  max: number;
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export function createPixels(width: number, height: number): Pixels {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

/** Y = 0.299R + 0.587G + 0.114B (BT.601), dibulatkan ke 0..255. */
export function toGray(p: Pixels): Uint8ClampedArray {
  const n = p.width * p.height;
  const out = new Uint8ClampedArray(n);
  const d = p.data;
  for (let i = 0; i < n; i++) {
    const j = i * 4;
    out[i] = Math.round(0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]);
  }
  return out;
}

export function computeHistograms(p: Pixels, gray: Uint8ClampedArray): Histograms {
  const r = new Uint32Array(256);
  const g = new Uint32Array(256);
  const b = new Uint32Array(256);
  const y = new Uint32Array(256);
  const d = p.data;
  const n = p.width * p.height;
  for (let i = 0; i < n; i++) {
    const j = i * 4;
    r[d[j]]++;
    g[d[j + 1]]++;
    b[d[j + 2]]++;
    y[gray[i]]++;
  }
  return { r, g, b, y };
}

export function channelStats(hist: ArrayLike<number>): ChannelStats {
  let total = 0;
  let sum = 0;
  let peak = 0;
  let min = -1;
  let max = 0;
  for (let k = 0; k < 256; k++) {
    const c = hist[k];
    total += c;
    sum += k * c;
    if (c > hist[peak]) peak = k;
    if (c > 0) {
      if (min < 0) min = k;
      max = k;
    }
  }
  if (total === 0) return { mean: 0, std: 0, skew: 0, peak: 0, min: 0, max: 0 };

  const mean = sum / total;
  let m2 = 0;
  let m3 = 0;
  for (let k = 0; k < 256; k++) {
    const dk = k - mean;
    m2 += dk * dk * hist[k];
    m3 += dk * dk * dk * hist[k];
  }
  const std = Math.sqrt(m2 / total);
  const skew = std > 1e-9 ? m3 / total / std ** 3 : 0;
  return { mean, std, skew, peak, min, max };
}

/** Entropi Shannon (bit/piksel) dari histogram. */
export function entropy(hist: ArrayLike<number>): number {
  let total = 0;
  for (let k = 0; k < 256; k++) total += hist[k];
  if (total === 0) return 0;
  let h = 0;
  for (let k = 0; k < 256; k++) {
    if (hist[k] > 0) {
      const p = hist[k] / total;
      h -= p * Math.log2(p);
    }
  }
  return h;
}

/**
 * Otsu: memaksimalkan varians antar-kelas.
 * Mengembalikan T sehingga g = 255 jika f >= T (konsisten dengan rumus di UI).
 */
export function otsuThreshold(hist: ArrayLike<number>): number {
  let total = 0;
  let sum = 0;
  for (let k = 0; k < 256; k++) {
    total += hist[k];
    sum += k * hist[k];
  }
  let wB = 0;
  let sumB = 0;
  let best = -1;
  let t = 0;
  for (let k = 0; k < 256; k++) {
    wB += hist[k];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += k * hist[k];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) {
      best = between;
      t = k;
    }
  }
  return Math.min(255, t + 1);
}

export function applyGray(p: Pixels): Pixels {
  const out = createPixels(p.width, p.height);
  const gray = toGray(p);
  for (let i = 0; i < gray.length; i++) {
    const j = i * 4;
    out.data[j] = out.data[j + 1] = out.data[j + 2] = gray[i];
    out.data[j + 3] = 255;
  }
  return out;
}

/** g(x,y) = 255 jika Y(x,y) >= T, selain itu 0. */
export function applyThreshold(p: Pixels, t: number): Pixels {
  const out = createPixels(p.width, p.height);
  const gray = toGray(p);
  for (let i = 0; i < gray.length; i++) {
    const j = i * 4;
    const v = gray[i] >= t ? 255 : 0;
    out.data[j] = out.data[j + 1] = out.data[j + 2] = v;
    out.data[j + 3] = 255;
  }
  return out;
}

/** f'(x,y) = 255 - f(x,y) pada tiap channel RGB. */
export function applyNegative(p: Pixels): Pixels {
  const out = createPixels(p.width, p.height);
  for (let i = 0; i < p.width * p.height; i++) {
    const j = i * 4;
    out.data[j] = 255 - p.data[j];
    out.data[j + 1] = 255 - p.data[j + 1];
    out.data[j + 2] = 255 - p.data[j + 2];
    out.data[j + 3] = 255;
  }
  return out;
}

/**
 * Konvolusi 2D sejati (kernel dibalik) pada citra grayscale.
 * Batas citra: replicate (piksel tepi diulang). Hasil dibagi `divisor`.
 */
export function convolveGray(
  gray: ArrayLike<number>,
  w: number,
  h: number,
  kernel: KernelMatrix,
  divisor = 1,
): Float32Array {
  const kh = kernel.length;
  const kw = kernel[0]?.length ?? 0;
  const out = new Float32Array(w * h);
  if (kh === 0 || kw === 0) return out;

  const cy = (kh - 1) >> 1;
  const cx = (kw - 1) >> 1;
  const div = divisor === 0 ? 1 : divisor;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let ky = 0; ky < kh; ky++) {
        const sy = clamp(y + ky - cy, 0, h - 1);
        const row = kernel[kh - 1 - ky];
        for (let kx = 0; kx < kw; kx++) {
          const sx = clamp(x + kx - cx, 0, w - 1);
          acc += row[kw - 1 - kx] * gray[sy * w + sx];
        }
      }
      out[y * w + x] = acc / div;
    }
  }
  return out;
}

/** |∇f| = sqrt(Gx² + Gy²) dengan operator Sobel 3×3. Skala 0..~1442. */
export function gradientMagnitude(gray: ArrayLike<number>, w: number, h: number) {
  const gx = convolveGray(gray, w, h, SOBEL_GX);
  const gy = convolveGray(gray, w, h, SOBEL_GY);
  const magnitude = new Float32Array(w * h);
  let max = 0;
  for (let i = 0; i < magnitude.length; i++) {
    const m = Math.hypot(gx[i], gy[i]);
    magnitude[i] = m;
    if (m > max) max = m;
  }
  return { magnitude, max };
}

/**
 * Ubah nilai float menjadi citra abu-abu untuk ditampilkan.
 * "abs": |v| dinormalisasi ke nilai maksimum (untuk kernel tepi, jumlah = 0).
 * "clamp": v dipotong ke 0..255 (untuk blur/sharpen).
 * "gamma": sqrt(v / max) agar tepi lemah tetap terlihat.
 */
export function normalizeToPixels(
  values: ArrayLike<number>,
  w: number,
  h: number,
  mode: "abs" | "clamp" | "gamma",
): Pixels {
  const out = createPixels(w, h);
  let max = 0;
  if (mode !== "clamp") {
    for (let i = 0; i < values.length; i++) max = Math.max(max, Math.abs(values[i]));
  }
  for (let i = 0; i < w * h; i++) {
    let v: number;
    if (mode === "clamp") v = values[i];
    else if (max <= 0) v = 0;
    else if (mode === "abs") v = (Math.abs(values[i]) / max) * 255;
    else v = Math.sqrt(Math.abs(values[i]) / max) * 255;
    const c = clamp(Math.round(v), 0, 255);
    const j = i * 4;
    out.data[j] = out.data[j + 1] = out.data[j + 2] = c;
    out.data[j + 3] = 255;
  }
  return out;
}

/** Adegan sintetis deterministik: dipakai jika gambar remote tidak bisa dibaca canvas. */
export function makeTestPixels(w = 640, h = 400): Pixels {
  const p = createPixels(w, h);
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const sunX = 0.72 * w;
  const sunY = 0.3 * h;
  const sunR = 0.12 * h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = y / h;
      let r = 40 + 150 * t;
      let g = 70 + 90 * t;
      let b = 160 - 60 * t;
      if (y > 0.7 * h) {
        const stripe = Math.floor(x / 24) % 2 === 0 ? 0 : 14;
        r = 40 + stripe;
        g = 90 + stripe;
        b = 50 + stripe;
      }
      if (x > 0.12 * w && x < 0.3 * w && y > 0.35 * h && y < 0.7 * h) {
        r = 60;
        g = 60;
        b = 80;
      }
      const dist = Math.hypot(x - sunX, y - sunY);
      if (dist < sunR) {
        const k = clamp((sunR - dist) / 6, 0, 1);
        r = r + (255 - r) * k;
        g = g + (220 - g) * k;
        b = b + (120 - b) * k;
      }
      const noise = (rnd() - 0.5) * 12;
      const j = (y * w + x) * 4;
      p.data[j] = r + noise;
      p.data[j + 1] = g + noise;
      p.data[j + 2] = b + noise;
      p.data[j + 3] = 255;
    }
  }
  return p;
}
