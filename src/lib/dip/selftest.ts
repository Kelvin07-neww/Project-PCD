import { analyzeImage } from "./analyze";
import {
  applyNegative, applyThreshold, channelStats, convolveGray, createPixels, entropy,
  gradientMagnitude, makeTestPixels, otsuThreshold, toGray,
} from "./core";
import { KERNEL_PRESETS, SOBEL_GX } from "../../data/kernels";

let failed = 0;
function check(name: string, ok: boolean, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failed++;
}
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;

function fill(w: number, h: number, f: (x: number, y: number) => number) {
  const p = createPixels(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = f(x, y), j = (y * w + x) * 4;
    p.data[j] = p.data[j + 1] = p.data[j + 2] = v; p.data[j + 3] = 255;
  }
  return p;
}

const flat = fill(32, 32, () => 128);
const aFlat = analyzeImage(flat);
check("flat: entropy = 0", near(aFlat.entropy, 0));
check("flat: mean = 128, std = 0", near(aFlat.stats.y.mean, 128) && near(aFlat.stats.y.std, 0));
check("flat: edge density = 0", aFlat.edgeDensity === 0);

const two = fill(40, 40, (x) => (x < 20 ? 50 : 200));
const aTwo = analyzeImage(two);
check("two-tone: entropy = 1 bit", near(aTwo.entropy, 1, 1e-9));
check("two-tone: Otsu T in (50, 200]", aTwo.otsu > 50 && aTwo.otsu <= 200, `T=${aTwo.otsu}`);
const bin = applyThreshold(two, aTwo.otsu);
check("two-tone: biner memisahkan kedua sisi", bin.data[0] === 0 && bin.data[39 * 4] === 255);
check("two-tone: histogram jumlah = total", aTwo.hist.y.reduce((s, v) => s + v, 0) === 1600);
check("two-tone: skew 0 (simetris)", near(aTwo.stats.y.skew, 0, 1e-9));

const g = toGray(flat);
check("Sobel pada citra seragam = 0 (termasuk tepi)", convolveGray(g, 32, 32, SOBEL_GX).every((v) => v === 0));
const gauss = KERNEL_PRESETS.find((k) => k.id === "gaussian")!;
check("Gaussian/16 mempertahankan nilai konstan", convolveGray(g, 32, 32, gauss.matrix, gauss.divisor).every((v) => near(v, 128, 1e-3)));
const lap = KERNEL_PRESETS.find((k) => k.id === "laplacian")!;
check("Laplacian pada citra seragam = 0", convolveGray(g, 32, 32, lap.matrix).every((v) => v === 0));

const step = toGray(two);
const { magnitude, max } = gradientMagnitude(step, 40, 40);
check("Sobel step: puncak = 4*(200-50) = 600", near(max, 600, 1e-3), `max=${max}`);
check("Sobel step: jauh dari batas = 0", magnitude[5 * 40 + 3] === 0 && magnitude[5 * 40 + 35] === 0);
check("konvolusi sejati: Gx step naik bertanda negatif", convolveGray(step, 40, 40, SOBEL_GX)[5 * 40 + 20] < 0);

const neg = applyNegative(fill(2, 2, () => 10));
check("negatif: 255 - 10 = 245", neg.data[0] === 245 && neg.data[3] === 255);
const h = new Uint32Array(256); h[10] = 3; h[20] = 1;
const st = channelStats(h);
check("channelStats: mean 12.5, peak 10, min 10, max 20", near(st.mean, 12.5) && st.peak === 10 && st.min === 10 && st.max === 20);
check("channelStats: skew > 0 (ekor kanan)", st.skew > 0);
check("entropy 4 nilai sama = 2 bit", near(entropy(new Uint32Array(256).map((_, i) => (i < 4 ? 5 : 0))), 2));
check("otsu histogram bimodal 50/200", (() => { const b = new Uint32Array(256); b[50] = 10; b[200] = 10; const t = otsuThreshold(b); return t > 50 && t <= 200; })());

const syn = makeTestPixels();
const t0 = performance.now();
const aSyn = analyzeImage(syn);
const dt = performance.now() - t0;
check("sintetis 640×400: entropi wajar (3..8)", aSyn.entropy > 3 && aSyn.entropy < 8, `H=${aSyn.entropy.toFixed(2)}`);
check("sintetis: kepadatan tepi 0..100%", aSyn.edgeDensity > 0 && aSyn.edgeDensity < 100, `${aSyn.edgeDensity.toFixed(2)}%`);
check("sintetis: analisis penuh < 500 ms", dt < 500, `${dt.toFixed(0)} ms`);

console.log(failed === 0 ? "\nSEMUA LOLOS" : `\n${failed} GAGAL`);
if (failed > 0) throw new Error("selftest gagal");
