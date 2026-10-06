import { PillarCard } from "@/components/home/PillarCard";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import {
  CREATIVE_FILTER_CHIPS,
  CREATIVE_SWATCHES,
  PILLARS,
  PILLAR_WAVEFORM_PATHS,
  WAVEFORM_READOUTS,
} from "@/data/home";
import { cx } from "@/lib/cx";

function FilterChipsVisual() {
  return (
    <div className="mb-space-xl flex flex-wrap gap-2">
      {CREATIVE_FILTER_CHIPS.map((chip) => (
        <Chip
          key={chip.label}
          dotClassName={chip.dotClassName}
          className="bg-surface-container-high px-2.5 py-1 font-label-md text-label-md text-on-surface"
        >
          {chip.label}
        </Chip>
      ))}
    </div>
  );
}

function SwatchStack() {
  return (
    <div className="flex items-center -space-x-2" aria-hidden="true">
      {CREATIVE_SWATCHES.map((swatch) => (
        <div
          key={swatch}
          className={cx("h-8 w-8 rounded-full shadow-md ring-2 ring-surface-container-low", swatch)}
        />
      ))}
    </div>
  );
}

function WaveformVisual() {
  return (
    <div className="mb-space-md w-full rounded-xl bg-surface-container-lowest p-3">
      <div className="mb-1 flex items-center justify-between font-metric-mono-sm text-[11px] text-on-surface-variant">
        {WAVEFORM_READOUTS.map((readout) => (
          <span key={readout.label} className={readout.className}>
            {readout.label}: {readout.value}
          </span>
        ))}
      </div>
      <svg aria-hidden="true" className="h-16 w-full" fill="none" viewBox="0 0 240 60">
        {[15, 30, 45].map((y) => (
          <line key={y} x1="0" x2="240" y1={y} y2={y} stroke="rgba(255,255,255,0.05)" />
        ))}
        {PILLAR_WAVEFORM_PATHS.map((path) => (
          <path key={path.d} d={path.d} stroke={path.stroke} strokeWidth={path.strokeWidth} />
        ))}
      </svg>
    </div>
  );
}

function SpectralVisual() {
  return (
    <div className="mb-space-md flex w-full items-center justify-around rounded-xl bg-surface-container-lowest p-3">
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-surface-container">
        <div className="h-8 w-8 rounded-full bg-secondary/30 blur-sm" />
        <div className="absolute h-2 w-2 rounded-full bg-secondary shadow-[0_0_8px_#d0bcff]" />
        <span className="absolute bottom-1 right-1 font-metric-mono-sm text-[8px] text-outline">LOW PASS</span>
      </div>
      <Icon name="sync_alt" className="text-[18px] text-outline" />
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-surface-container">
        <div className="h-12 w-12 animate-spin rounded-full border border-secondary/40 motion-reduce:animate-none" />
        <div className="absolute h-1 w-1 rounded-full bg-tertiary" />
        <span className="absolute bottom-1 right-1 font-metric-mono-sm text-[8px] text-outline">HIGH PASS</span>
      </div>
    </div>
  );
}

export function PillarsSection() {
  const [creative, analysis, fourier] = PILLARS;

  return (
    <section className="relative w-full bg-surface py-24">
      <div className="mx-auto w-full max-w-7xl px-margin-mobile sm:px-margin">
        <div className="mb-16 flex flex-col justify-between gap-space-md md:flex-row md:items-end">
          <div>
            <Chip
              shape="rect"
              className="mb-space-sm bg-surface-container-highest px-space-sm py-1 font-metric-mono-sm text-metric-mono-sm uppercase text-tertiary"
            >
              Core Instrument Capabilities
            </Chip>
            <h2 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
              Designed for Artistry. Built on Pure Mathematics.
            </h2>
          </div>
          <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
            Explore three complementary visual disciplines in one synchronized environment, from studio
            photo shoots to rigorous discrete image processing.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-3">
          <PillarCard pillar={creative} footerLeft={<SwatchStack />}>
            <FilterChipsVisual />
          </PillarCard>
          <PillarCard pillar={analysis}>
            <WaveformVisual />
          </PillarCard>
          <PillarCard pillar={fourier}>
            <SpectralVisual />
          </PillarCard>
        </div>
      </div>
    </section>
  );
}
