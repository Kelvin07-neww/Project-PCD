import { calibrate, gaussian, otsu, toGray } from "./dip";

export type EditMode = "none" | "gray" | "negative" | "sepia" | "binary";

export interface EditSettings {
  exposure: number;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number; // σ Gaussian, 0 = mati
  sharpen: number; // jumlah unsharp mask, 0 = mati
  equalize: boolean;
  mode: EditMode;
  threshold: number;
  flipH: boolean;
  rotate: number; // 0 | 90 | 180 | 270
}

export const DEFAULT_EDIT: EditSettings = {
  exposure: 0, brightness: 100, contrast: 100, saturation: 100, blur: 0, sharpen: 0,
  equalize: false, mode: "none", threshold: 128, flipH: false, rotate: 0,
};

const luma = (p: Uint8ClampedArray, i: number) => 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];

/** Histogram equalization pada luminansi: s = (CDF(k) - CDFmin) / (N - CDFmin) · 255. */
function equalizeLuma(img: ImageData): void {
  const p = img.data, n = img.width * img.height;
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < n; i++) hist[luma(p, i * 4) | 0]++;
  const map = new Float32Array(256);
  let cum = 0, cdfMin = 0;
  for (let k = 0; k < 256; k++) {
    cum += hist[k];
    if (!cdfMin && cum) cdfMin = cum;
    map[k] = n > cdfMin ? ((cum - cdfMin) / (n - cdfMin)) * 255 : k;
  }
  for (let i = 0; i < n; i++) {
    const j = i * 4, y = luma(p, j) | 0, ny = map[y];
    if (y < 1) { p[j] = p[j + 1] = p[j + 2] = ny; continue; }
    const r = ny / y;
    p[j] *= r; p[j + 1] *= r; p[j + 2] *= r;
  }
}

function blurRGB(img: ImageData, sigma: number): Float32Array[] {
  const { width: w, height: h, data: p } = img;
  return [0, 1, 2].map((c) => {
    const ch = new Float32Array(w * h);
    for (let i = 0; i < ch.length; i++) ch[i] = p[i * 4 + c];
    return gaussian(ch, w, h, sigma);
  });
}

/** Urutan: kalibrasi → equalize → saturasi → blur → sharpen (unsharp mask) → mode warna. In-place. */
export function applyEdit(img: ImageData, s: EditSettings): void {
  calibrate(img, { exposure: s.exposure, brightness: s.brightness, contrast: s.contrast });
  if (s.equalize) equalizeLuma(img);
  const p = img.data, n = img.width * img.height;

  if (s.saturation !== 100) {
    const k = s.saturation / 100;
    for (let i = 0; i < n; i++) {
      const j = i * 4, y = luma(p, j), r = p[j], g = p[j + 1], b = p[j + 2];
      p[j] = y + (r - y) * k; p[j + 1] = y + (g - y) * k; p[j + 2] = y + (b - y) * k;
    }
  }
  if (s.blur > 0) {
    const b = blurRGB(img, s.blur);
    for (let c = 0; c < 3; c++) for (let i = 0; i < n; i++) p[i * 4 + c] = b[c][i];
  }
  if (s.sharpen > 0) {
    const b = blurRGB(img, 1.2);
    for (let c = 0; c < 3; c++) for (let i = 0; i < n; i++) p[i * 4 + c] += s.sharpen * (p[i * 4 + c] - b[c][i]);
  }
  if (s.mode === "none") return;
  for (let i = 0; i < n; i++) {
    const j = i * 4, r = p[j], g = p[j + 1], b = p[j + 2], y = luma(p, j);
    if (s.mode === "gray") { p[j] = p[j + 1] = p[j + 2] = y; }
    else if (s.mode === "negative") { p[j] = 255 - r; p[j + 1] = 255 - g; p[j + 2] = 255 - b; }
    else if (s.mode === "binary") { p[j] = p[j + 1] = p[j + 2] = y > s.threshold ? 255 : 0; }
    else { p[j] = 0.393 * r + 0.769 * g + 0.189 * b; p[j + 1] = 0.349 * r + 0.686 * g + 0.168 * b; p[j + 2] = 0.272 * r + 0.534 * g + 0.131 * b; }
  }
}

/** Ambang optimal Otsu dari gambar saat ini. */
export const autoThreshold = (img: ImageData): number => otsu(toGray(img));
