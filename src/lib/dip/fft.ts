import { createPixels, type Pixels } from "./core";

/** Ukuran transformasi (harus pangkat 2). Citra dipotong persegi lalu diskalakan ke N × N. */
export const FFT_SIZE = 256;

export type FilterType = "none" | "low" | "high";
export type FilterShape = "ideal" | "butterworth" | "gaussian";

export interface Spectrum {
  n: number;
  re: Float64Array;
  im: Float64Array;
}

const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;

/** FFT 1D radix-2 Cooley-Tukey, in-place. Inverse sudah dinormalisasi 1/n. */
export function fft1d(re: Float64Array, im: Float64Array, inverse = false): void {
  const n = re.length;
  if (!isPowerOfTwo(n)) throw new Error("FFT length must be a power of two");

  // permutasi bit-reversal
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k;
        const b = a + half;
        const vr = re[b] * cr - im[b] * ci;
        const vi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - vr;
        im[b] = im[a] - vi;
        re[a] += vr;
        im[a] += vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }

  if (inverse) {
    for (let i = 0; i < n; i++) {
      re[i] /= n;
      im[i] /= n;
    }
  }
}

/** FFT 2D n × n: baris dulu, lalu kolom. Forward tidak dinormalisasi; inverse membagi n². */
export function fft2d(re: Float64Array, im: Float64Array, n: number, inverse = false): void {
  const tr = new Float64Array(n);
  const ti = new Float64Array(n);
  for (let y = 0; y < n; y++) {
    const o = y * n;
    for (let x = 0; x < n; x++) {
      tr[x] = re[o + x];
      ti[x] = im[o + x];
    }
    fft1d(tr, ti, inverse);
    for (let x = 0; x < n; x++) {
      re[o + x] = tr[x];
      im[o + x] = ti[x];
    }
  }
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      tr[y] = re[y * n + x];
      ti[y] = im[y * n + x];
    }
    fft1d(tr, ti, inverse);
    for (let y = 0; y < n; y++) {
      re[y * n + x] = tr[y];
      im[y * n + x] = ti[y];
    }
  }
}

/** Potong persegi di tengah, lalu skala bilinear ke n × n. */
export function squareGray(gray: ArrayLike<number>, w: number, h: number, n: number): Float64Array {
  const side = Math.min(w, h);
  const x0 = (w - side) / 2;
  const y0 = (h - side) / 2;
  const out = new Float64Array(n * n);
  const at = (x: number, y: number) => gray[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  for (let y = 0; y < n; y++) {
    const sy = y0 + ((y + 0.5) * side) / n - 0.5;
    const iy = Math.floor(sy);
    const fy = sy - iy;
    for (let x = 0; x < n; x++) {
      const sx = x0 + ((x + 0.5) * side) / n - 0.5;
      const ix = Math.floor(sx);
      const fx = sx - ix;
      const top = at(ix, iy) * (1 - fx) + at(ix + 1, iy) * fx;
      const bottom = at(ix, iy + 1) * (1 - fx) + at(ix + 1, iy + 1) * fx;
      out[y * n + x] = top * (1 - fy) + bottom * fy;
    }
  }
  return out;
}

/** (-1)^(x+y) lalu FFT: DC berada di tengah (n/2, n/2). */
export function forwardSpectrum(values: ArrayLike<number>, n: number): Spectrum {
  const re = new Float64Array(n * n);
  const im = new Float64Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      re[y * n + x] = (x + y) % 2 === 0 ? values[y * n + x] : -values[y * n + x];
    }
  }
  fft2d(re, im, n, false);
  return { n, re, im };
}

/** IFFT lalu (-1)^(x+y) lagi; mengembalikan bagian real. */
export function inverseSpectrum(spec: Spectrum): Float64Array {
  const { n } = spec;
  const re = Float64Array.from(spec.re);
  const im = Float64Array.from(spec.im);
  fft2d(re, im, n, true);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if ((x + y) % 2 !== 0) re[y * n + x] = -re[y * n + x];
    }
  }
  return re;
}

export function energy(spec: Spectrum): number {
  let sum = 0;
  for (let i = 0; i < spec.re.length; i++) sum += spec.re[i] ** 2 + spec.im[i] ** 2;
  return sum;
}

export function logMagnitude(spec: Spectrum): Float64Array {
  const out = new Float64Array(spec.re.length);
  for (let i = 0; i < out.length; i++) out[i] = Math.log1p(Math.hypot(spec.re[i], spec.im[i]));
  return out;
}

/** Fungsi transfer H(u,v) terpusat; D = jarak dari titik pusat (DC). */
export function filterMask(
  n: number,
  type: Exclude<FilterType, "none">,
  shape: FilterShape,
  d0: number,
  order: number,
): Float64Array {
  const H = new Float64Array(n * n);
  const c = n / 2;
  const cutoff = Math.max(d0, 1e-6);
  for (let v = 0; v < n; v++) {
    for (let u = 0; u < n; u++) {
      const d = Math.hypot(u - c, v - c);
      let low: number;
      if (shape === "ideal") low = d <= cutoff ? 1 : 0;
      else if (shape === "butterworth") low = 1 / (1 + (d / cutoff) ** (2 * order));
      else low = Math.exp(-(d * d) / (2 * cutoff * cutoff));
      H[v * n + u] = type === "low" ? low : 1 - low;
    }
  }
  return H;
}

export function applyMask(spec: Spectrum, H: ArrayLike<number>): Spectrum {
  const re = new Float64Array(spec.re.length);
  const im = new Float64Array(spec.im.length);
  for (let i = 0; i < re.length; i++) {
    re[i] = spec.re[i] * H[i];
    im[i] = spec.im[i] * H[i];
  }
  return { n: spec.n, re, im };
}

function grayPixels(n: number, f: (i: number) => number): Pixels {
  const out = createPixels(n, n);
  for (let i = 0; i < n * n; i++) {
    const c = Math.min(255, Math.max(0, Math.round(f(i))));
    const j = i * 4;
    out.data[j] = out.data[j + 1] = out.data[j + 2] = c;
    out.data[j + 3] = 255;
  }
  return out;
}

/** Nilai non-negatif dinormalisasi ke maksimumnya (untuk log-magnitude). */
export function normalizedPixels(values: ArrayLike<number>, n: number): Pixels {
  let max = 0;
  for (let i = 0; i < n * n; i++) max = Math.max(max, values[i]);
  return grayPixels(n, (i) => (max > 0 ? (values[i] / max) * 255 : 0));
}

/** Nilai 0..255 apa adanya (dipotong); `offset` dipakai untuk citra high-pass (rata-rata 0). */
export function directPixels(values: ArrayLike<number>, n: number, offset = 0): Pixels {
  return grayPixels(n, (i) => values[i] + offset);
}

export function maskPixels(H: ArrayLike<number> | null, n: number): Pixels {
  return grayPixels(n, (i) => (H ? H[i] * 255 : 255));
}

export function meanSquaredError(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return sum / a.length;
}
