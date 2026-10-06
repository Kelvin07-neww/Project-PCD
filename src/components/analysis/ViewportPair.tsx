import { PixelCanvas } from "@/components/analysis/PixelCanvas";
import { Icon } from "@/components/ui/Icon";
import { EDGE_THRESHOLD, type Analysis } from "@/lib/dip/analyze";
import type { LoadedImage } from "@/lib/dip/image";

interface ViewportPairProps {
  image: LoadedImage;
  analysis: Analysis;
}

export function ViewportPair({ image, analysis }: ViewportPairProps) {
  const cx = Math.floor(analysis.width / 2);
  const cy = Math.floor(analysis.height / 2);

  return (
    <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
      <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container shadow-xl">
        <div className="flex items-center justify-between bg-surface-container-high px-space-md py-space-sm">
          <div className="flex items-center gap-space-xs font-label-lg text-label-lg text-on-surface">
            <Icon name="image" className="text-[16px] text-primary" />
            <span>Spatial Domain Input f(x, y)</span>
          </div>
          <div className="flex items-center gap-space-sm">
            <span className="rounded bg-surface-container px-space-xs py-0.5 font-metric-mono-sm text-metric-mono-sm text-outline">CH: RGB</span>
            <span className="rounded bg-primary-container px-space-xs py-0.5 font-metric-mono-sm text-metric-mono-sm text-on-primary-container">SOURCE</span>
          </div>
        </div>
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-surface-container-lowest">
          <PixelCanvas pixels={image.pixels} label={`Source image: ${image.label}`} className="h-full w-full object-contain" />
          <div className="absolute bottom-space-sm left-space-sm flex items-center gap-2 rounded bg-surface-container-lowest/90 px-space-sm py-1 font-metric-mono-sm text-metric-mono-sm text-on-surface backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Origin Center: [{cx}, {cy}]</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container shadow-xl">
        <div className="flex items-center justify-between bg-surface-container-high px-space-md py-space-sm">
          <div className="flex items-center gap-space-xs font-label-lg text-label-lg text-on-surface">
            <Icon name="polyline" className="text-[16px] text-tertiary" />
            <span>Gradient Magnitude |∇f(x, y)|</span>
          </div>
          <div className="flex items-center gap-space-sm">
            <span className="rounded bg-surface-container px-space-xs py-0.5 font-metric-mono-sm text-metric-mono-sm text-outline">SOBEL 3×3</span>
            <span className="rounded bg-secondary-container px-space-xs py-0.5 font-metric-mono-sm text-metric-mono-sm text-on-secondary-container">DIAGNOSTIC</span>
          </div>
        </div>
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-surface-container-lowest">
          <PixelCanvas pixels={analysis.gradient} label="Sobel gradient magnitude map" className="h-full w-full object-contain" />
          <div className="absolute right-space-sm top-space-sm rounded bg-surface-container-lowest/80 px-space-xs py-1 font-metric-mono-sm text-metric-mono-sm text-tertiary backdrop-blur">
            EDGE DENSITY: {analysis.edgeDensity.toFixed(2)}% (|∇f| &gt; {EDGE_THRESHOLD})
          </div>
          <div className="absolute bottom-space-sm right-space-sm rounded bg-surface-container-lowest/80 px-space-xs py-1 font-metric-mono-sm text-metric-mono-sm text-on-surface-variant backdrop-blur">
            Normalized, √ gamma for visibility
          </div>
        </div>
      </div>
    </div>
  );
}
