import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { FourierControls } from "@/components/fourier/FourierControls";
import { SpectrumPanels } from "@/components/fourier/SpectrumPanels";
import { Icon } from "@/components/ui/Icon";
import { useAnalysisImage } from "@/hooks/useAnalysisImage";
import { toGray } from "@/lib/dip/core";
import {
  FFT_SIZE,
  applyMask,
  directPixels,
  energy,
  filterMask,
  forwardSpectrum,
  inverseSpectrum,
  logMagnitude,
  maskPixels,
  meanSquaredError,
  normalizedPixels,
  squareGray,
  type FilterShape,
  type FilterType,
} from "@/lib/dip/fft";

const N = FFT_SIZE;
const C = N / 2;

export default function FourierSpectrum() {
  const { image, loading, notice, loadTest, loadFile } = useAnalysisImage();
  const inputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<FilterType>("low");
  const [shape, setShape] = useState<FilterShape>("butterworth");
  const [d0, setD0] = useState(30);
  const [order, setOrder] = useState(2);

  const base = useMemo(() => {
    if (!image) return null;
    const { pixels } = image;
    const square = squareGray(toGray(pixels), pixels.width, pixels.height, N);
    const t0 = performance.now();
    const spec = forwardSpectrum(square, N);
    const forwardMs = performance.now() - t0;
    return {
      square,
      spec,
      forwardMs,
      total: energy(spec),
      dc: Math.hypot(spec.re[C * N + C], spec.im[C * N + C]),
      original: directPixels(square, N),
      spectrum: normalizedPixels(logMagnitude(spec), N),
    };
  }, [image]);

  const filtered = useMemo(() => {
    if (!base) return null;
    const t0 = performance.now();
    const H = type === "none" ? null : filterMask(N, type, shape, d0, order);
    const spec = H ? applyMask(base.spec, H) : base.spec;
    const rec = inverseSpectrum(spec);
    const ms = performance.now() - t0;
    const display = type === "high" ? 128 : 0;
    const clipped = Float64Array.from(rec, (v) => Math.min(255, Math.max(0, v)));
    return {
      ms,
      retained: (energy(spec) / base.total) * 100,
      mse: meanSquaredError(clipped, base.square),
      mask: maskPixels(H, N),
      result: directPixels(rec, N, display),
    };
  }, [base, type, shape, d0, order]);

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void loadFile(file);
    event.target.value = "";
  };

  const metrics =
    base && filtered
      ? [
          { label: "TRANSFORM SIZE", value: `${N} × ${N} (radix-2)`, tone: "text-on-surface" },
          { label: "FORWARD FFT", value: `${base.forwardMs.toFixed(1)} ms (CPU)`, tone: "text-tertiary" },
          { label: "FILTER + IFFT", value: `${filtered.ms.toFixed(1)} ms`, tone: "text-secondary" },
          { label: "ENERGY RETAINED", value: `${filtered.retained.toFixed(2)} %`, tone: "text-on-surface" },
          { label: "MSE vs ORIGINAL", value: filtered.mse < 1e-6 ? "< 1e-6" : filtered.mse.toFixed(2), tone: "text-on-surface" },
        ]
      : [];

  return (
    <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-space-xl px-margin-mobile py-space-xl sm:px-margin">
      <div className="flex flex-col justify-between gap-space-lg lg:flex-row lg:items-end">
        <div className="flex max-w-4xl flex-col gap-space-xs">
          <div className="flex flex-wrap items-center gap-space-sm font-metric-mono-sm text-metric-mono-sm text-secondary">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-secondary motion-reduce:animate-none" />
            <span>SPECTRAL MATRIX / 2D FFT ENGINE</span>
            <span className="text-outline">::</span>
            <span className="max-w-[260px] truncate text-on-surface-variant" title={image?.label}>
              SRC: {image?.label ?? "loading…"}
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">Fourier Spectrum Lab</h1>
          <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
            Deconstruct the photo into spatial frequencies, isolate low or high bands with ideal, Butterworth and Gaussian
            filters, then reconstruct it with the inverse FFT.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-space-sm">
          <input ref={inputRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={onFile} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-space-xs rounded-lg bg-surface-container px-space-md py-2 font-label-lg text-label-lg text-on-surface shadow-sm outline-none transition-all hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            <Icon name="photo_library" className="text-[18px] text-tertiary" />
            <span>Select Target Photo</span>
          </button>
          <button
            type="button"
            onClick={() => void loadTest()}
            className="flex items-center gap-space-xs rounded-lg bg-surface-container px-space-md py-2 font-label-lg text-label-lg text-on-surface-variant shadow-sm outline-none transition-all hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            <Icon name="science" className="text-[18px] text-secondary" />
            <span>Use Test Image</span>
          </button>
        </div>
      </div>

      {notice && (
        <div role="status" className="flex items-start gap-space-sm rounded-lg bg-surface-container-low p-space-md font-body-sm text-body-sm text-on-surface-variant">
          <Icon name="info" className="mt-0.5 shrink-0 text-[18px] text-tertiary" />
          <span>{notice}</span>
        </div>
      )}

      {!base || !filtered ? (
        <div role="status" aria-live="polite" className="flex min-h-[40vh] items-center justify-center gap-space-sm font-metric-mono-sm text-metric-mono-sm text-on-surface-variant">
          <Icon name="progress_activity" className="animate-spin text-[20px] text-primary motion-reduce:animate-none" />
          <span>{loading ? "Computing spectrum…" : "No image loaded"}</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-space-sm md:grid-cols-3 xl:grid-cols-5">
            {metrics.map((m) => (
              <div key={m.label} className="flex flex-col rounded-lg bg-surface-container-low p-space-sm px-space-md shadow-sm">
                <span className="font-metric-mono-sm text-metric-mono-sm text-outline">{m.label}</span>
                <span className={`font-metric-mono-lg text-metric-mono-lg font-medium ${m.tone}`}>{m.value}</span>
              </div>
            ))}
          </div>

          <FourierControls
            type={type}
            shape={shape}
            d0={d0}
            order={order}
            maxD0={C}
            onType={setType}
            onShape={setShape}
            onD0={setD0}
            onOrder={setOrder}
          />

          <SpectrumPanels
            n={N}
            original={base.original}
            spectrum={base.spectrum}
            mask={filtered.mask}
            result={filtered.result}
            cutoff={type === "none" ? null : d0}
            highPass={type === "high"}
            dc={base.dc}
          />

          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <div className="flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-md">
              <div className="flex items-center gap-space-xs font-headline-md text-headline-md text-primary">
                <Icon name="radio_button_checked" className="text-[18px]" />
                <span>Low frequencies (center)</span>
              </div>
              <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                Smooth illumination and large shapes. A low-pass filter keeps them and blurs the photo; a smaller cutoff D₀
                blurs more. The ideal filter can add ringing around edges, which Butterworth and Gaussian avoid.
              </p>
            </div>
            <div className="flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-md">
              <div className="flex items-center gap-space-xs font-headline-md text-headline-md text-secondary">
                <Icon name="grain" className="text-[18px]" />
                <span>High frequencies (periphery)</span>
              </div>
              <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                Edges, fine texture and noise. A high-pass filter removes the DC term, so the result has zero mean and is
                shown with a +128 offset. Larger D₀ leaves only the sharpest edges.
              </p>
            </div>
          </div>
          <p className="font-metric-mono-sm text-metric-mono-sm text-outline">
            The photo is center-cropped to a square and resampled to {N} × {N} px before the transform. Pipeline: grayscale →
            (−1)^(x+y) centering → 2D FFT → H(u,v) → inverse FFT.
          </p>
        </>
      )}
    </div>
  );
}