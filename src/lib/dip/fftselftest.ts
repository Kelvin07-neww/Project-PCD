import {
  applyMask, energy, fft1d, fft2d, filterMask, forwardSpectrum, inverseSpectrum,
  meanSquaredError, squareGray,
} from "./fft";

let failed = 0;
function check(name: string, ok: boolean, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failed++;
}
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const maxAbsDiff = (a: ArrayLike<number>, b: ArrayLike<number>) => {
  let m = 0;
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i]));
  return m;
};

// 1. FFT 1D vs DFT naif
{
  const n = 16;
  const xr = Float64Array.from({ length: n }, () => rnd() * 10);
  const xi = Float64Array.from({ length: n }, () => rnd() * 10);
  const nr = new Float64Array(n), ni = new Float64Array(n);
  for (let k = 0; k < n; k++) for (let t = 0; t < n; t++) {
    const a = (-2 * Math.PI * k * t) / n;
    nr[k] += xr[t] * Math.cos(a) - xi[t] * Math.sin(a);
    ni[k] += xr[t] * Math.sin(a) + xi[t] * Math.cos(a);
  }
  const fr = Float64Array.from(xr), fi = Float64Array.from(xi);
  fft1d(fr, fi);
  check("FFT 1D = DFT naif (n=16)", maxAbsDiff(fr, nr) < 1e-9 && maxAbsDiff(fi, ni) < 1e-9);
}

// 2. roundtrip + Parseval 2D
{
  const n = 32;
  const re = Float64Array.from({ length: n * n }, () => rnd() * 255);
  const im = new Float64Array(n * n);
  const orig = Float64Array.from(re);
  let spatial = 0;
  for (const v of re) spatial += v * v;
  fft2d(re, im, n);
  let freq = 0;
  for (let i = 0; i < re.length; i++) freq += re[i] ** 2 + im[i] ** 2;
  check("Parseval 2D: sum|x|² = sum|X|²/N²", Math.abs(spatial - freq / (n * n)) / spatial < 1e-12);
  fft2d(re, im, n, true);
  check("roundtrip FFT→IFFT 2D", maxAbsDiff(re, orig) < 1e-9);
}

// 3. impuls di origin -> spektrum datar
{
  const n = 16;
  const re = new Float64Array(n * n), im = new Float64Array(n * n);
  re[0] = 1;
  fft2d(re, im, n);
  check("impuls → magnitude datar = 1", re.every((v, i) => Math.abs(Math.hypot(v, im[i]) - 1) < 1e-12));
}

// 4. konstanta -> hanya DC di tengah
{
  const n = 32, c = n / 2;
  const s = forwardSpectrum(new Float64Array(n * n).fill(100), n);
  const mag = (x: number, y: number) => Math.hypot(s.re[y * n + x], s.im[y * n + x]);
  let others = 0;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (x !== c || y !== c) others = Math.max(others, mag(x, y));
  check("konstanta: DC di (n/2,n/2) = 100·n²", Math.abs(mag(c, c) - 100 * n * n) < 1e-6);
  check("konstanta: semua selain DC ≈ 0", others < 1e-6);
}

// 5. sinusoida -> puncak di (c±k, c)
{
  const n = 64, c = n / 2, k = 5;
  const img = Float64Array.from({ length: n * n }, (_, i) => 128 + 50 * Math.cos((2 * Math.PI * k * (i % n)) / n));
  const s = forwardSpectrum(img, n);
  const mag = (x: number, y: number) => Math.hypot(s.re[y * n + x], s.im[y * n + x]);
  check("sinusoida k=5: puncak di (c±5, c)", mag(c + k, c) > 1000 && mag(c - k, c) > 1000 && mag(c + k + 3, c) < 1e-6);
}

// 6. mask
{
  const n = 64, c = n / 2;
  const g = filterMask(n, "low", "gaussian", 10, 2);
  const b = filterMask(n, "low", "butterworth", 10, 2);
  const i = filterMask(n, "low", "ideal", 10, 2);
  const hp = filterMask(n, "high", "butterworth", 10, 2);
  check("Gaussian LP di pusat = 1", g[c * n + c] === 1);
  check("Butterworth LP di D=D0 = 0.5", Math.abs(b[c * n + (c + 10)] - 0.5) < 1e-12);
  check("Ideal LP: dalam=1, luar=0", i[c * n + (c + 10)] === 1 && i[c * n + (c + 11)] === 0);
  check("HP = 1 − LP", Math.abs(hp[c * n + (c + 10)] - 0.5) < 1e-12 && hp[c * n + c] === 0);
}

// 7. filter pada citra
{
  const n = 64;
  const img = Float64Array.from({ length: n * n }, () => rnd() * 255);
  const s = forwardSpectrum(img, n);
  const all = inverseSpectrum(applyMask(s, filterMask(n, "low", "ideal", 1000, 1)));
  check("ideal LP dengan D0 sangat besar = identitas", meanSquaredError(all, img) < 1e-18);
  // noise berrata-rata nol, agar DC tidak mendominasi energi
  const zm = Float64Array.from(img, (v) => v - 127.5);
  const sz = forwardSpectrum(zm, n);
  const lp = applyMask(sz, filterMask(n, "low", "gaussian", 6, 1));
  check("LP gaussian pada noise zero-mean: energi tersisa < 20%", energy(lp) < energy(sz) * 0.2);
  const flat = forwardSpectrum(new Float64Array(n * n).fill(90), n);
  const hpOut = inverseSpectrum(applyMask(flat, filterMask(n, "high", "gaussian", 6, 1)));
  check("HP pada citra konstan ≈ 0", hpOut.every((v) => Math.abs(v) < 1e-9));
  const lpOut = inverseSpectrum(applyMask(flat, filterMask(n, "low", "gaussian", 6, 1)));
  check("LP pada citra konstan = tetap 90", lpOut.every((v) => Math.abs(v - 90) < 1e-9));
}

// 8. resample persegi
{
  const g = Float64Array.from({ length: 40 * 20 }, () => 77);
  const sq = squareGray(g, 40, 20, 16);
  check("squareGray: citra seragam tetap seragam", sq.every((v) => Math.abs(v - 77) < 1e-9));
}

// 9. kecepatan
{
  const n = 256;
  const img = Float64Array.from({ length: n * n }, () => rnd() * 255);
  const t0 = performance.now();
  const s = forwardSpectrum(img, n);
  inverseSpectrum(s);
  const dt = performance.now() - t0;
  check("FFT+IFFT 256×256 < 300 ms", dt < 300, `${dt.toFixed(0)} ms`);
}

console.log(failed === 0 ? "\nSEMUA LOLOS" : `\n${failed} GAGAL`);
if (failed > 0) throw new Error("fftselftest gagal");
