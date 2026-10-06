import { Icon } from "@/components/ui/Icon";
import { CANNY_PREVIEW_PATHS } from "@/data/home";

export function CannyModule() {
  return (
    <div className="relative z-20 mt-4 max-w-xs rounded-2xl bg-surface-container-high/90 p-3.5 shadow-2xl backdrop-blur-xl transition-transform hover:-translate-y-1 sm:absolute sm:-bottom-6 sm:-left-8 sm:mt-0">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface">
          <Icon name="grain" className="text-[15px] text-tertiary" />
          <span className="font-semibold">Detektor Tepi Canny</span>
        </div>
        <span className="rounded bg-surface-container px-1.5 py-0.5 font-metric-mono-sm text-[10px] text-tertiary-fixed">
          σ = 1.4
        </span>
      </div>

      <div className="relative flex h-20 w-full items-center justify-center overflow-hidden rounded-lg bg-surface-container-lowest">
        <svg aria-hidden="true" className="h-full w-full p-1 text-tertiary/80" fill="none" viewBox="0 0 160 70">
          {CANNY_PREVIEW_PATHS.map((path) => (
            <path
              key={path.d}
              d={path.d}
              stroke={path.stroke}
              strokeWidth={path.strokeWidth}
              strokeDasharray={path.dashed ? "2 1" : undefined}
            />
          ))}
          <circle cx="60" cy="33" r="1.5" fill="#7bd0ff" />
          <circle cx="100" cy="33" r="1.5" fill="#7bd0ff" />
        </svg>
        <div className="absolute bottom-1 right-2 font-metric-mono-sm text-[9px] text-outline">
          Threshold ganda [50, 150]
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-outline-variant/30 pt-2 font-metric-mono-sm text-[11px] text-on-surface-variant">
        <span>Supresi non-maks</span>
        <span className="text-emerald-400">AKTIF</span>
      </div>
    </div>
  );
}

export function FftModule() {
  return (
    <div className="relative z-20 mt-4 max-w-[240px] rounded-2xl bg-surface-container-high/90 p-3.5 shadow-2xl backdrop-blur-xl transition-transform hover:translate-y-1 sm:absolute sm:-right-8 sm:-top-6 sm:mt-0">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface">
          <Icon name="radar" className="text-[15px] text-secondary" />
          <span className="font-semibold">Magnitudo FFT 2D</span>
        </div>
        <span className="font-metric-mono-sm text-[10px] text-secondary">k-SPACE</span>
      </div>

      <div className="relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-surface-container-lowest p-2">
        <svg aria-hidden="true" className="h-20 w-20 text-secondary" fill="none" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" stroke="currentColor" strokeDasharray="2 3" strokeWidth="0.75" opacity="0.4" />
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeDasharray="3 2" strokeWidth="0.75" opacity="0.6" />
          <circle cx="50" cy="50" r="18" stroke="currentColor" strokeWidth="1" opacity="0.8" />
          <circle
            cx="50"
            cy="50"
            r="6"
            fill="#adc6ff"
            className="animate-pulse motion-reduce:animate-none"
          />
          <line x1="0" x2="100" y1="50" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
          <line x1="50" x2="50" y1="0" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
        </svg>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(208,188,255,0.1),transparent_70%)]"
        />
        <span className="absolute bottom-1 left-2 font-metric-mono-sm text-[9px] text-tertiary">
          Pergeseran Puncak DC: (0,0)
        </span>
      </div>

      <div className="mt-2 text-center">
        <span className="font-metric-mono-sm text-[10px] text-on-surface-variant">
          Spektrum Magnitudo Log (Terpusat)
        </span>
      </div>
    </div>
  );
}
