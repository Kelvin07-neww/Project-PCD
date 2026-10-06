import { useMemo, useState, type ReactNode } from "react";
import { PixelCanvas } from "@/components/analysis/PixelCanvas";
import type { Analysis } from "@/lib/dip/analyze";
import { applyGray, applyNegative, applyThreshold, type Pixels } from "@/lib/dip/core";

interface SplitProps {
  left: Pixels;
  leftLabel: string;
  right: Pixels;
  rightLabel: string;
  rightClassName: string;
  alt: string;
}

function Split({ left, leftLabel, right, rightLabel, rightClassName, alt }: SplitProps) {
  return (
    <div className="flex h-28 w-full items-center gap-space-xs overflow-hidden rounded-lg bg-surface-container-lowest">
      <div className="relative h-full w-1/2 overflow-hidden">
        <PixelCanvas pixels={left} label={`${alt}: ${leftLabel}`} className="h-full w-full object-cover" />
        <span className="absolute bottom-1 left-1 rounded bg-surface-container-lowest/80 px-1 font-metric-mono-sm text-metric-mono-sm text-on-surface">
          {leftLabel}
        </span>
      </div>
      <div className="relative h-full w-1/2 overflow-hidden">
        <PixelCanvas pixels={right} label={`${alt}: ${rightLabel}`} className="h-full w-full object-cover" />
        <span className={`absolute bottom-1 right-1 rounded bg-surface-container-lowest/80 px-1 font-metric-mono-sm text-metric-mono-sm ${rightClassName}`}>
          {rightLabel}
        </span>
      </div>
    </div>
  );
}

function Panel({
  title,
  status,
  statusClassName,
  formula,
  formulaClassName,
  children,
}: {
  title: string;
  status: string;
  statusClassName: string;
  formula: string;
  formulaClassName: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-space-md rounded-xl bg-surface-container p-space-md shadow-md">
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <span className="font-headline-md text-headline-md text-on-surface">{title}</span>
          <span className={`rounded px-space-xs py-0.5 font-metric-mono-sm text-metric-mono-sm font-medium ${statusClassName}`}>{status}</span>
        </div>
        <div className={`rounded bg-surface-container-lowest p-space-xs font-metric-mono-sm text-metric-mono-sm ${formulaClassName}`}>{formula}</div>
        {children}
      </div>
    </div>
  );
}

export function TransformSection({ pixels, analysis }: { pixels: Pixels; analysis: Analysis }) {
  const [t, setT] = useState(125);

  const gray = useMemo(() => applyGray(pixels), [pixels]);
  const negative = useMemo(() => applyNegative(pixels), [pixels]);
  const binary = useMemo(() => applyThreshold(pixels, t), [pixels, t]);

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Point &amp; Spatial Mathematical Transformations</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Deterministic mathematical mappings applied at each spatial coordinate (x, y).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-space-md lg:grid-cols-3">
        <Panel
          title="RGB → Grayscale"
          status="Live"
          statusClassName="bg-surface-container-highest text-tertiary"
          formula="Y = 0.299R + 0.587G + 0.114B"
          formulaClassName="text-secondary"
        >
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Luminosity psychophysical weighting accounting for human photoreceptor spectral sensitivity in the green spectrum.
          </p>
          <Split left={pixels} leftLabel="Input" right={gray} rightLabel="Y-channel" rightClassName="text-tertiary" alt="Grayscale" />
        </Panel>

        <Panel
          title="RGB → Binary Threshold"
          status="Interactive"
          statusClassName="bg-primary-container text-on-primary-container"
          formula="g(x,y) = 255 if Y(x,y) ≥ T else 0"
          formulaClassName="text-primary"
        >
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex justify-between font-metric-mono-sm text-metric-mono-sm text-on-surface-variant">
              <span>Threshold Parameter:</span>
              <span className="font-bold text-primary">
                T = {t}
                {t === analysis.otsu ? " (Otsu optimal)" : ""}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={255}
              value={t}
              aria-label="Binary threshold T"
              onChange={(event) => setT(Number(event.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-lowest accent-primary"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Otsu Auto-Calculate</span>
              <button
                type="button"
                onClick={() => setT(analysis.otsu)}
                className="rounded bg-surface-container-high px-2 py-0.5 font-metric-mono-sm text-metric-mono-sm text-secondary outline-none hover:bg-surface-container-highest focus-visible:ring-2 focus-visible:ring-primary/70"
              >
                Run Otsu (Optimal T: {analysis.otsu})
              </button>
            </div>
          </div>
          <Split left={gray} leftLabel="Y(x,y)" right={binary} rightLabel="Binary" rightClassName="text-primary" alt="Threshold" />
        </Panel>

        <Panel
          title="RGB → Negative"
          status="Live"
          statusClassName="bg-surface-container-highest text-tertiary"
          formula="f'(x,y) = 255 - f(x,y)"
          formulaClassName="text-tertiary"
        >
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Exact photographic negative inversion. Illuminates subtle deep-shadow textures and darkroom noise characteristics.
          </p>
          <Split left={pixels} leftLabel="Natural" right={negative} rightLabel="Inverted" rightClassName="text-tertiary" alt="Negative" />
        </Panel>
      </div>
    </div>
  );
}
