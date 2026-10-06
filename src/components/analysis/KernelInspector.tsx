import { useCallback, useEffect, useState } from "react";
import { PixelCanvas } from "@/components/analysis/PixelCanvas";
import { Icon } from "@/components/ui/Icon";
import { KERNEL_PRESETS, formatKernelValue, type KernelMatrix } from "@/data/kernels";
import type { Analysis } from "@/lib/dip/analyze";
import { convolveGray, normalizeToPixels, type Pixels } from "@/lib/dip/core";
import { cx } from "@/lib/cx";

const NUMBER_PATTERN = /^[+-]?\d*\.?\d*$/;

/** Teks sel -> angka. Teks setengah jadi seperti "-" atau "" dianggap 0. */
const parseCell = (text: string) => {
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
};

const toCells = (m: KernelMatrix) => m.map((row) => row.map(formatKernelValue));
const sumOf = (m: KernelMatrix) => m.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0);

interface RunResult {
  pixels: Pixels;
  ms: number;
}

export function KernelInspector({ analysis }: { analysis: Analysis }) {
  const [presetId, setPresetId] = useState<string>(KERNEL_PRESETS[0].id);
  const [cells, setCells] = useState<string[][]>(() => toCells(KERNEL_PRESETS[0].matrix));
  const [divisorText, setDivisorText] = useState(String(KERNEL_PRESETS[0].divisor));
  const [result, setResult] = useState<RunResult | null>(null);

  const { gray, width, height } = analysis;
  const matrix = cells.map((row) => row.map(parseCell));
  const divisor = parseCell(divisorText) || 1;
  const sum = sumOf(matrix);
  const preset = KERNEL_PRESETS.find((p) => p.id === presetId);

  const execute = useCallback(
    (m: KernelMatrix, d: number) => {
      const t0 = performance.now();
      const values = convolveGray(gray, width, height, m, d);
      // Kernel tepi (jumlah 0) dinormalisasi |v|; kernel lain dipotong ke 0..255.
      const mode = Math.abs(sumOf(m) / d) < 1e-9 ? "abs" : "clamp";
      const pixels = normalizeToPixels(values, width, height, mode);
      setResult({ pixels, ms: performance.now() - t0 });
    },
    [gray, width, height],
  );

  // Jalankan ulang saat gambar berubah
  useEffect(() => {
    execute(matrix, divisor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  const choosePreset = (id: string) => {
    const p = KERNEL_PRESETS.find((k) => k.id === id);
    if (!p) return;
    setPresetId(id);
    setCells(toCells(p.matrix));
    setDivisorText(String(p.divisor));
    execute(p.matrix, p.divisor);
  };

  const editCell = (r: number, c: number, text: string) => {
    if (!NUMBER_PATTERN.test(text)) return;
    setPresetId("custom");
    setCells((prev) => prev.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? text : v))));
  };

  const rows: { label: string; value: string; tone: string }[] = [
    { label: "Kernel Dimensions:", value: `${matrix.length} × ${matrix[0].length} (${matrix.length * matrix[0].length} elements)`, tone: "text-on-surface" },
    { label: "Divisor / Normalization:", value: `1 / ${divisor} (Sum = ${sum})`, tone: "text-on-surface" },
    { label: "Compute Time (CPU):", value: result ? `${result.ms.toFixed(1)} ms / run` : "—", tone: "text-tertiary font-bold" },
    { label: "Affected Canvas Pixels:", value: `${(width * height).toLocaleString("en-US")} (100.0%)`, tone: "text-on-surface" },
    { label: "Boundary Mode:", value: "Replicate Clamped Edges", tone: "text-secondary" },
  ];

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Spatial Convolution Kernel Inspector</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Neighborhood matrix operations: g(x,y) = f(x,y) * w(x,y) = ∑ ∑ w(s,t) f(x-s, y-t).
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        <div className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-lg shadow-xl lg:col-span-7">
          <div className="flex flex-col justify-between gap-space-xs sm:flex-row sm:items-center">
            <div className="flex items-center gap-space-xs font-headline-md text-headline-md text-on-surface">
              <Icon name="grid_4x4" className="text-[20px] text-primary" />
              <span>Active Kernel Matrix ({matrix.length} × {matrix[0].length})</span>
            </div>
            <span className="font-metric-mono-sm text-metric-mono-sm text-tertiary">{preset ? preset.title : "Custom kernel"}</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg bg-surface-container-lowest p-space-lg">
            <div className="grid w-64 grid-cols-3 gap-2">
              {cells.flatMap((row, r) =>
                row.map((text, c) => {
                  const v = parseCell(text);
                  return (
                    <input
                      key={`${r}-${c}`}
                      type="text"
                      inputMode="decimal"
                      value={text}
                      aria-label={`Kernel row ${r + 1}, column ${c + 1}`}
                      onChange={(event) => editCell(r, c, event.target.value)}
                      className={cx(
                        "h-12 w-full rounded bg-surface-container text-center font-metric-mono-lg text-metric-mono-lg shadow-inner outline-none transition-colors focus:bg-primary-container focus:text-on-primary-container",
                        v === 0 ? "text-on-surface-variant" : Math.abs(v) > 1 ? "font-bold text-primary" : "text-on-surface",
                      )}
                    />
                  );
                }),
              )}
            </div>
            <label className="mt-space-md flex items-center gap-space-sm font-metric-mono-sm text-metric-mono-sm text-outline">
              <span>Divisor</span>
              <input
                type="text"
                inputMode="decimal"
                value={divisorText}
                aria-label="Kernel divisor"
                onChange={(event) => NUMBER_PATTERN.test(event.target.value) && (setPresetId("custom"), setDivisorText(event.target.value))}
                className="h-8 w-16 rounded bg-surface-container text-center text-on-surface outline-none focus:bg-primary-container focus:text-on-primary-container"
              />
            </label>
            <div className="mt-space-sm font-metric-mono-sm text-metric-mono-sm text-outline">
              Anchor coordinate: (1, 1) [Replicate border handling]
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="mr-1 font-metric-mono-sm text-metric-mono-sm text-outline">PRESETS:</span>
            {KERNEL_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={presetId === p.id}
                onClick={() => choosePreset(p.id)}
                className={cx(
                  "rounded px-space-sm py-1 font-metric-mono-sm text-metric-mono-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
                  presetId === p.id
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset && <p className="font-body-sm text-body-sm text-on-surface-variant">{preset.description}</p>}
        </div>

        <div className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-lg shadow-xl lg:col-span-5">
          <div className="flex items-center justify-between">
            <span className="font-headline-md text-headline-md text-on-surface">Execution &amp; Result</span>
            <span className="flex items-center gap-1.5 rounded bg-surface-container-lowest px-space-xs py-0.5 font-metric-mono-sm text-metric-mono-sm text-tertiary">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              CPU · Canvas 2D
            </span>
          </div>

          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-surface-container-lowest">
            {result ? (
              <PixelCanvas pixels={result.pixels} label="Convolution result" className="h-full w-full object-contain" />
            ) : (
              <span className="font-metric-mono-sm text-metric-mono-sm text-outline">Press Execute</span>
            )}
          </div>

          <div className="flex flex-col gap-space-sm">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-lg bg-surface-container-low p-space-sm font-metric-mono-sm text-metric-mono-sm">
                <span className="text-on-surface-variant">{row.label}</span>
                <span className={cx("font-medium", row.tone)}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-space-xs rounded-lg bg-surface-container-lowest p-space-sm font-body-sm text-body-sm text-on-surface-variant">
            <Icon name="terminal" className="mt-0.5 shrink-0 text-[18px] text-secondary" />
            <span>
              Kernels whose weights sum to 0 (Sobel, Laplacian) are shown as |g| normalized to the maximum; blur and sharpen
              results are clamped to [0, 255]. Convolution is done on the grayscale (Y) image.
            </span>
          </div>

          <button
            type="button"
            onClick={() => execute(matrix, divisor)}
            className="flex w-full items-center justify-center gap-space-xs rounded-lg bg-primary py-2.5 font-label-lg text-label-lg text-on-primary shadow-[0_0_20px_-2px_rgba(59,130,246,0.35)] outline-none transition-all hover:bg-primary-fixed focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            <Icon name="play_arrow" className="text-[18px]" />
            <span>Execute Spatial Convolve on Image</span>
          </button>
        </div>
      </div>
    </div>
  );
}
