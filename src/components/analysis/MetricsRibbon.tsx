import type { Analysis } from "@/lib/dip/analyze";
import type { LoadedImage } from "@/lib/dip/image";

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function aspectLabel(w: number, h: number): string {
  const g = gcd(w, h);
  const a = w / g;
  const b = h / g;
  return a <= 21 && b <= 21 ? `${a}:${b}` : `${(w / h).toFixed(2)}:1`;
}

interface MetricsRibbonProps {
  image: LoadedImage;
  analysis: Analysis;
}

export function MetricsRibbon({ image, analysis }: MetricsRibbonProps) {
  const { sourceWidth: sw, sourceHeight: sh } = image;
  const { stats } = analysis;
  const lo = Math.min(stats.r.min, stats.g.min, stats.b.min);
  const hi = Math.max(stats.r.max, stats.g.max, stats.b.max);
  const totalSource = sw * sh;

  const items = [
    { label: "DIMENSIONS", value: `${sw} × ${sh} px`, tone: "text-on-surface" },
    { label: "ASPECT RATIO", value: aspectLabel(sw, sh), tone: "text-on-surface" },
    {
      label: "TOTAL PIXELS",
      value: `${totalSource.toLocaleString("en-US")} (${(totalSource / 1e6).toFixed(2)} MP)`,
      tone: "text-on-surface",
    },
    { label: "COLOR SPACE", value: "sRGB 8-bit (canvas)", tone: "text-tertiary" },
    { label: "SHANNON ENTROPY", value: `${analysis.entropy.toFixed(2)} bits/pixel`, tone: "text-secondary" },
    { label: "DYNAMIC RANGE", value: `[${lo}, ${hi}] (8-bit)`, tone: "text-on-surface" },
  ];

  const downscaled = analysis.width !== sw || analysis.height !== sh;

  return (
    <div className="flex flex-col gap-space-xs">
      <div className="grid grid-cols-2 gap-space-sm md:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col rounded-lg bg-surface-container-low p-space-sm px-space-md shadow-sm">
            <span className="font-metric-mono-sm text-metric-mono-sm text-outline">{item.label}</span>
            <span className={`font-metric-mono-lg text-metric-mono-lg font-medium ${item.tone}`}>{item.value}</span>
          </div>
        ))}
      </div>
      {downscaled && (
        <p className="font-metric-mono-sm text-metric-mono-sm text-outline">
          Metrics below are computed on a {analysis.width} × {analysis.height} px working copy (longest side ≤ 640 px) to
          keep the lab fast.
        </p>
      )}
    </div>
  );
}
