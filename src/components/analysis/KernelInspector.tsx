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
  const [divisorText, setPembagiText] = useState(String(KERNEL_PRESETS[0].divisor));
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
    setPembagiText(String(p.divisor));
    execute(p.matrix, p.divisor);
  };

  const editCell = (r: number, c: number, text: string) => {
    if (!NUMBER_PATTERN.test(text)) return;
    setPresetId("custom");
    setCells((prev) => prev.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? text : v))));
  };

  const rows: { label: string; value: string; tone: string }[] = [
    { label: "Dimensi Kernel:", value: `${matrix.length} × ${matrix[0].length} (${matrix.length * matrix[0].length} elemen)`, tone: "text-on-surface" },
    { label: "Pembagi / Normalisasi:", value: `1 / ${divisor} (Jumlah = ${sum})`, tone: "text-on-surface" },
    { label: "Waktu Komputasi (CPU):", value: result ? `${result.ms.toFixed(1)} ms / eksekusi` : "—", tone: "text-tertiary font-bold" },
    { label: "Piksel Canvas Terpengaruh:", value: `${(width * height).toLocaleString("en-US")} (100.0%)`, tone: "text-on-surface" },
    { label: "Mode Batas:", value: "Replikasi Tepi Terbatas", tone: "text-secondary" },
  ];

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Inspektor Kernel Konvolusi Spasial</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Operasi matriks ketetanggaan: g(x,y) = f(x,y) * w(x,y) = ∑ ∑ w(s,t) f(x-s, y-t).
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        <div className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-lg shadow-xl lg:col-span-7">
          <div className="flex flex-col justify-between gap-space-xs sm:flex-row sm:items-center">
            <div className="flex items-center gap-space-xs font-headline-md text-headline-md text-on-surface">
              <Icon name="grid_4x4" className="text-[20px] text-primary" />
              <span>Matriks Kernel Aktif ({matrix.length} × {matrix[0].length})</span>
            </div>
            <span className="font-metric-mono-sm text-metric-mono-sm text-tertiary">{preset ? preset.title : "Kernel kustom"}</span>
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
                      aria-label={`Baris kernel ${r + 1}, kolom ${c + 1}`}
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
              <span>Pembagi</span>
              <input
                type="text"
                inputMode="decimal"
                value={divisorText}
                aria-label="Pembagi kernel"
                onChange={(event) => NUMBER_PATTERN.test(event.target.value) && (setPresetId("custom"), setPembagiText(event.target.value))}
                className="h-8 w-16 rounded bg-surface-container text-center text-on-surface outline-none focus:bg-primary-container focus:text-on-primary-container"
              />
            </label>
            <div className="mt-space-sm font-metric-mono-sm text-metric-mono-sm text-outline">
              Koordinat anchor: (1, 1) [penanganan batas replikasi]
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="mr-1 font-metric-mono-sm text-metric-mono-sm text-outline">PRASETEL:</span>
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
            <span className="font-headline-md text-headline-md text-on-surface">Eksekusi &amp; Hasil</span>
            <span className="flex items-center gap-1.5 rounded bg-surface-container-lowest px-space-xs py-0.5 font-metric-mono-sm text-metric-mono-sm text-tertiary">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              CPU · Canvas 2D
            </span>
          </div>

          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-surface-container-lowest">
            {result ? (
              <PixelCanvas pixels={result.pixels} label="Hasil konvolusi" className="h-full w-full object-contain" />
            ) : (
              <span className="font-metric-mono-sm text-metric-mono-sm text-outline">Tekan Eksekusi</span>
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
              Kernel dengan total bobot 0 (Sobel, Laplacian) ditampilkan sebagai |g| yang dinormalisasi ke maksimum; hasil blur dan penajaman
              dibatasi ke [0, 255]. Konvolusi dilakukan pada gambar grayscale (Y).
            </span>
          </div>

          <button
            type="button"
            onClick={() => execute(matrix, divisor)}
            className="flex w-full items-center justify-center gap-space-xs rounded-lg bg-primary py-2.5 font-label-lg text-label-lg text-on-primary shadow-[0_0_20px_-2px_rgba(59,130,246,0.35)] outline-none transition-all hover:bg-primary-fixed focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            <Icon name="play_arrow" className="text-[18px]" />
            <span>Jalankan Konvolusi Spasial pada Gambar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
