import type { ReactNode } from "react";
import { PixelCanvas } from "@/components/analysis/PixelCanvas";
import type { Pixels } from "@/lib/dip/core";

function Frame({
  title,
  badge,
  titleClassName,
  children,
}: {
  title: string;
  badge: string;
  titleClassName: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-surface-container-low">
      <div className="flex items-center justify-between bg-surface-container-high px-space-sm py-1.5 font-metric-mono-sm text-metric-mono-sm">
        <span className={titleClassName}>{title}</span>
        <span className="text-outline">{badge}</span>
      </div>
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-surface-container-lowest">
        {children}
      </div>
    </div>
  );
}

interface SpectrumPanelsProps {
  n: number;
  original: Pixels;
  spectrum: Pixels;
  mask: Pixels;
  result: Pixels;
  /** Jari-jari cutoff (piksel spektrum); null jika tanpa filter. */
  cutoff: number | null;
  highPass: boolean;
  dc: number;
}

export function SpectrumPanels({ n, original, spectrum, mask, result, cutoff, highPass, dc }: SpectrumPanelsProps) {
  const img = "h-full w-full object-contain";
  return (
    <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
      <Frame title="1. Asli f(x,y)" badge="Spasial" titleClassName="text-on-surface">
        <PixelCanvas pixels={original} label="Gambar spasial grayscale" className={img} />
      </Frame>

      <Frame title="2. Spektrum |F(u,v)|" badge="log(1 + |F|)" titleClassName="text-secondary">
        <PixelCanvas pixels={spectrum} label="Spektrum magnitudo log" className={img} />
        {cutoff !== null && (
          <svg aria-hidden="true" viewBox={`0 0 ${n} ${n}`} className="pointer-events-none absolute inset-0 h-full w-full">
            <circle cx={n / 2} cy={n / 2} r={cutoff} fill="none" stroke="#7bd0ff" strokeWidth={1.5} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
        <span className="absolute bottom-2 left-2 rounded bg-surface-container-lowest/80 px-1.5 py-0.5 font-metric-mono-sm text-metric-mono-sm text-secondary">
          DC |F(0,0)| = {dc.toExponential(2)}
        </span>
      </Frame>

      <Frame title="3. Filter H(u,v)" badge="0 … 1" titleClassName="text-primary">
        <PixelCanvas pixels={mask} label="Fungsi transfer filter" className={img} />
      </Frame>

      <Frame title="4. Rekonstruksi FFT Invers" badge={highPass ? "+128 offset" : "IFFT"} titleClassName="text-tertiary">
        <PixelCanvas pixels={result} label="Gambar rekonstruksi setelah FFT invers" className={img} />
      </Frame>
    </div>
  );
}
