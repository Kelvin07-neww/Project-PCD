import { Icon } from "@/components/ui/Icon";
import { ThirdsGrid } from "@/components/ui/ThirdsGrid";
import { HERO_HISTOGRAM_PATHS } from "@/data/home";
import { TEST_PORTRAIT_URL } from "@/data/assets";

const CORNERS = [
  "-top-1 -left-1 border-t-2 border-l-2",
  "-top-1 -right-1 border-t-2 border-r-2",
  "-bottom-1 -left-1 border-b-2 border-l-2",
  "-bottom-1 -right-1 border-b-2 border-r-2",
];

function BiometricReticle() {
  return (
    <div className="pointer-events-none absolute left-[44%] top-[22%] h-[54%] w-[26%] transition-all duration-300">
      <div className="relative h-full w-full rounded-lg bg-primary/5 shadow-[0_0_24px_rgba(77,142,255,0.2)]">
        {CORNERS.map((corner) => (
          <div key={corner} className={`absolute h-4 w-4 border-primary ${corner}`} />
        ))}

        <div className="absolute left-[28%] top-[32%] flex items-center justify-center">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-tertiary shadow-[0_0_8px_#7bd0ff] motion-reduce:animate-none" />
          <span className="absolute -top-4 whitespace-nowrap font-metric-mono-sm text-[9px] text-tertiary">
            EYE_L: 0.98
          </span>
        </div>
        <div className="absolute right-[28%] top-[32%] flex items-center justify-center">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-tertiary shadow-[0_0_8px_#7bd0ff] motion-reduce:animate-none" />
          <span className="absolute -top-4 whitespace-nowrap font-metric-mono-sm text-[9px] text-tertiary">
            EYE_R: 0.99
          </span>
        </div>

        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <div className="h-0.5 w-6 bg-primary/80" />
          <div className="absolute h-6 w-0.5 bg-primary/80" />
        </div>

        <div className="absolute -bottom-7 left-0 flex items-center gap-1.5 rounded bg-surface-container-lowest/90 px-2 py-0.5 font-metric-mono-sm text-[10px] text-primary-fixed shadow-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>SUBJECT_01 • CONFIDENCE 99.4%</span>
        </div>
      </div>
    </div>
  );
}

function LiveWaveformBadge() {
  return (
    <div className="absolute bottom-4 left-4 hidden max-w-xs rounded-xl bg-surface-container-lowest/90 p-3 shadow-xl backdrop-blur-md sm:block">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1 font-metric-mono-sm text-metric-mono-sm text-on-surface">
          <Icon name="query_stats" className="text-[14px] text-tertiary" /> LIVE RGB WAVEFORM
        </span>
        <span className="font-metric-mono-sm text-[10px] text-outline">256 BINS</span>
      </div>
      <svg aria-hidden="true" className="h-12 w-48" fill="none" preserveAspectRatio="none" viewBox="0 0 180 40">
        {HERO_HISTOGRAM_PATHS.map((path) => (
          <path
            key={path.d}
            d={path.d}
            fill={path.fill}
            stroke={path.stroke}
            strokeWidth={path.strokeWidth}
          />
        ))}
      </svg>
    </div>
  );
}

export function ViewportMockup() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-2 shadow-2xl sm:p-3">
      {/* Toolbar */}
      <div className="flex h-10 select-none items-center justify-between rounded-t-xl bg-surface-container px-space-md font-metric-mono-sm text-metric-mono-sm text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-error/70" />
          <span className="h-3 w-3 rounded-full bg-amber-400/70" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
          <span className="ml-2 font-medium text-on-surface">SESSION_LIVE_CANVAS::001</span>
        </div>
        <div className="hidden items-center gap-4 sm:flex">
          <span className="flex items-center gap-1 font-semibold text-tertiary">
            <span className="h-1.5 w-1.5 rounded-full bg-tertiary" /> RAW BUFFER 32-BIT FLOAT
          </span>
          <span className="text-outline">ISO 100 • ƒ/1.8 • 1/125s</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface">
          <Icon name="grid_4x4" className="text-[16px]" />
          <Icon name="aspect_ratio" className="text-[16px]" />
          <Icon name="crop_free" className="text-[16px]" />
        </div>
      </div>

      {/* Viewport */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-b-xl bg-surface-container-lowest sm:aspect-[1.79]">
        <img
          alt="Cinematic close-up portrait of a thoughtful person in soft studio split lighting"
          src={TEST_PORTRAIT_URL}
          className="h-full w-full object-cover object-center contrast-[1.05]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30"
        />
        <ThirdsGrid lineClassName="border-primary/40" className="opacity-25" />

        <BiometricReticle />
        <LiveWaveformBadge />

        <div className="absolute right-4 top-4 flex items-center gap-3 rounded-lg bg-surface-container-lowest/90 px-3 py-2 font-metric-mono-sm text-metric-mono-sm text-on-surface shadow-lg backdrop-blur-md">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" /> 60.0 FPS
          </span>
          <span className="text-outline-variant">|</span>
          <span>1920 × 1080</span>
          <span className="text-outline-variant">|</span>
          <span className="text-tertiary">RGB 24-bit sRGB</span>
        </div>

        <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-surface-container-lowest/90 px-3 py-1.5 font-metric-mono-sm text-metric-mono-sm shadow-md backdrop-blur-md">
          <Icon name="shutter_speed" className="text-[16px] text-secondary" />
          <span className="text-on-surface-variant">COLOR_SPACE:</span>
          <span className="font-semibold text-secondary">Linear Float (sRGB_D65)</span>
        </div>
      </div>
    </div>
  );
}
