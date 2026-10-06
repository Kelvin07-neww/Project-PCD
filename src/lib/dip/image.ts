import { TEST_PORTRAIT_URL } from "../../data/assets";
import { createPixels, makeTestPixels, type Pixels } from "./core";

/** Sisi terpanjang gambar yang dianalisis; gambar lebih besar diperkecil agar cepat. */
export const MAX_ANALYSIS_SIDE = 640;

export interface LoadedImage {
  pixels: Pixels;
  sourceWidth: number;
  sourceHeight: number;
  label: string;
}

function loadImage(src: string, crossOrigin: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gambar gagal dimuat"));
    img.src = src;
  });
}

function rasterize(img: HTMLImageElement, label: string): LoadedImage {
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  if (sw === 0 || sh === 0) throw new Error("Gambar tidak memiliki dimensi");

  const scale = Math.min(1, MAX_ANALYSIS_SIDE / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D tidak tersedia");
  ctx.drawImage(img, 0, 0, w, h);

  // getImageData melempar SecurityError jika canvas "tainted" (CORS).
  const frame = ctx.getImageData(0, 0, w, h);
  const pixels = createPixels(w, h);
  pixels.data.set(frame.data);
  return { pixels, sourceWidth: sw, sourceHeight: sh, label };
}

export async function loadFromUrl(url: string, label: string): Promise<LoadedImage> {
  return rasterize(await loadImage(url, true), label);
}

export async function loadFromFile(file: File): Promise<LoadedImage> {
  const url = URL.createObjectURL(file);
  try {
    return rasterize(await loadImage(url, false), file.name);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function loadTestImage(): Promise<{ image: LoadedImage; fellBack: boolean }> {
  try {
    return { image: await loadFromUrl(TEST_PORTRAIT_URL, "Potret uji"), fellBack: false };
  } catch {
    const pixels = makeTestPixels();
    return {
      image: {
        pixels,
        sourceWidth: pixels.width,
        sourceHeight: pixels.height,
        label: "Adegan uji sintetis",
      },
      fellBack: true,
    };
  }
}
