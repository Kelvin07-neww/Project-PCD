import {
  channelStats,
  computeHistograms,
  entropy,
  gradientMagnitude,
  normalizeToPixels,
  otsuThreshold,
  toGray,
  type ChannelStats,
  type Histograms,
  type Pixels,
} from "./core";

/** Ambang magnitude Sobel (skala 0..1442) untuk menghitung kepadatan tepi. */
export const EDGE_THRESHOLD = 100;

export interface Analysis {
  width: number;
  height: number;
  total: number;
  hist: Histograms;
  stats: { r: ChannelStats; g: ChannelStats; b: ChannelStats; y: ChannelStats };
  entropy: number;
  gray: Uint8ClampedArray;
  otsu: number;
  gradient: Pixels;
  /** Persentase piksel dengan |∇f| > EDGE_THRESHOLD. */
  edgeDensity: number;
  ms: number;
}

export function analyzeImage(p: Pixels): Analysis {
  const t0 = performance.now();
  const gray = toGray(p);
  const hist = computeHistograms(p, gray);
  const { magnitude, max } = gradientMagnitude(gray, p.width, p.height);

  let edgePixels = 0;
  for (let i = 0; i < magnitude.length; i++) if (magnitude[i] > EDGE_THRESHOLD) edgePixels++;

  const total = p.width * p.height;
  return {
    width: p.width,
    height: p.height,
    total,
    hist,
    stats: {
      r: channelStats(hist.r),
      g: channelStats(hist.g),
      b: channelStats(hist.b),
      y: channelStats(hist.y),
    },
    entropy: entropy(hist.y),
    gray,
    otsu: otsuThreshold(hist.y),
    gradient: normalizeToPixels(magnitude, p.width, p.height, max > 0 ? "gamma" : "clamp"),
    edgeDensity: total > 0 ? (edgePixels / total) * 100 : 0,
    ms: performance.now() - t0,
  };
}
