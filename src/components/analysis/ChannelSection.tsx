import { useState } from "react";
import { HistogramChart, type HistogramSeries } from "@/components/analysis/HistogramChart";
import { Icon } from "@/components/ui/Icon";
import type { Analysis } from "@/lib/dip/analyze";
import type { ChannelStats } from "@/lib/dip/core";
import { cx } from "@/lib/cx";

type ChannelKey = "r" | "g" | "b";
type View = "all" | ChannelKey | "y";

/** Semua class ditulis utuh agar terdeteksi Tailwind. */
const CHANNELS: readonly {
  key: ChannelKey;
  name: string;
  dot: string;
  badge: string;
  stroke: string;
  toggle: string;
}[] = [
  { key: "r", name: "Red Channel (R)", dot: "bg-error", badge: "bg-error-container text-on-error-container", stroke: "#ffb4ab", toggle: "text-error" },
  { key: "g", name: "Green Channel (G)", dot: "bg-tertiary", badge: "bg-tertiary-container text-on-tertiary-container", stroke: "#7bd0ff", toggle: "text-tertiary" },
  { key: "b", name: "Blue Channel (B)", dot: "bg-primary", badge: "bg-primary-container text-on-primary-container", stroke: "#adc6ff", toggle: "text-primary" },
];

const signed = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}`;

function StatCell({ label, stats }: { label: string; stats: ChannelStats }) {
  const values = [
    { k: "Mean", v: stats.mean.toFixed(1), cls: "" },
    { k: "StdDev", v: stats.std.toFixed(1), cls: "" },
    { k: "Skew", v: signed(stats.skew), cls: "text-right" },
  ];
  return (
    <div aria-label={`${label} statistics`} className="grid grid-cols-3 gap-space-xs pt-1 font-metric-mono-sm text-metric-mono-sm text-on-surface-variant">
      {values.map((item) => (
        <div key={item.k} className={item.cls}>
          {item.k}: <span className="font-medium text-on-surface">{item.v}</span>
        </div>
      ))}
    </div>
  );
}

export function ChannelSection({ analysis }: { analysis: Analysis }) {
  const [view, setView] = useState<View>("all");
  const { hist, stats } = analysis;

  const channelSeries = (key: ChannelKey): HistogramSeries => {
    const def = CHANNELS.find((c) => c.key === key)!;
    return { id: key, bins: hist[key], stroke: def.stroke, fill: def.stroke, fillOpacity: 0.15 };
  };
  const ySeries: HistogramSeries = { id: "y", bins: hist.y, stroke: "#dee2f6", dashed: true, strokeWidth: 1.5 };

  const masterSeries: HistogramSeries[] =
    view === "all"
      ? [ySeries, channelSeries("r"), channelSeries("g"), channelSeries("b")]
      : view === "y"
        ? [{ ...ySeries, dashed: false, fill: "#dee2f6", fillOpacity: 0.12 }]
        : [channelSeries(view)];

  const shown = view === "all" ? hist.y : hist[view];
  let shownTotal = 0;
  let shownMax = 0;
  for (let k = 0; k < 256; k++) {
    shownTotal += shown[k];
    shownMax = Math.max(shownMax, shown[k]);
  }
  const pMax = shownTotal > 0 ? shownMax / shownTotal : 0;

  const lo = Math.min(stats.r.min, stats.g.min, stats.b.min);
  const hi = Math.max(stats.r.max, stats.g.max, stats.b.max);

  const TOGGLES: { id: View; label: string; cls: string }[] = [
    { id: "all", label: "All (RGB+Y)", cls: "text-on-surface" },
    { id: "r", label: "R", cls: "text-error" },
    { id: "g", label: "G", cls: "text-tertiary" },
    { id: "b", label: "B", cls: "text-primary" },
    { id: "y", label: "Y", cls: "text-on-surface" },
  ];

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">RGB Color Space Decomposition &amp; Density Histograms</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Probability distribution analysis across discrete 8-bit quantization bins [r, g, b ∈ 0..255].
        </p>
      </div>

      <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
        {CHANNELS.map((c) => (
          <div key={c.key} className="flex flex-col gap-space-sm rounded-xl bg-surface-container p-space-md shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cx("h-3 w-3 rounded-full", c.dot)} />
                <span className="font-headline-md text-headline-md text-on-surface">{c.name}</span>
              </div>
              <span className={cx("rounded px-space-xs py-0.5 font-metric-mono-sm text-metric-mono-sm", c.badge)}>
                Peak @ {stats[c.key].peak}
              </span>
            </div>
            <div className="flex h-20 w-full items-end overflow-hidden rounded bg-surface-container-lowest p-1">
              <HistogramChart
                series={[channelSeries(c.key)]}
                width={256}
                height={80}
                className="h-full w-full"
                label={`${c.name} histogram`}
              />
            </div>
            <StatCell label={c.name} stats={stats[c.key]} />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-lg shadow-xl">
        <div className="flex flex-col items-start justify-between gap-space-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-space-sm">
            <Icon name="equalizer" className="text-[20px] text-primary" />
            <span className="font-headline-md text-headline-md text-on-surface">Master High-Precision Density Spectrum</span>
          </div>
          <div role="group" aria-label="Histogram channel" className="flex items-center gap-space-xs rounded-lg bg-surface-container-lowest px-space-xs py-1">
            {TOGGLES.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={view === t.id}
                onClick={() => setView(t.id)}
                className={cx(
                  "rounded px-space-sm py-0.5 font-metric-mono-sm text-metric-mono-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/70",
                  t.cls,
                  view === t.id ? "bg-surface-container-high" : "hover:bg-surface-container",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex h-72 w-full flex-col justify-between overflow-hidden rounded-lg bg-surface-container-lowest p-space-md">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between p-space-md opacity-20">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-full border-b border-outline-variant" />
            ))}
          </div>
          <HistogramChart series={masterSeries} className="absolute inset-0 h-full w-full p-space-md" label="Master histogram" />
          <div className="relative z-10 flex justify-between font-metric-mono-sm text-metric-mono-sm text-outline">
            <span>p(k) Max: {pMax.toFixed(4)}</span>
            <span>Raw bins, 5-tap smoothed curve</span>
          </div>
          <div className="relative z-10 flex justify-between border-t border-surface-container-highest pt-2 font-metric-mono-sm text-metric-mono-sm text-outline">
            <span>0 (Shadow / Pure Black)</span>
            <span>64</span>
            <span>128 (Midtone Gray)</span>
            <span>192</span>
            <span>255 (Saturation White)</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-space-md pt-space-xs lg:flex-row">
          <div className="flex w-full flex-col gap-space-xs lg:w-1/2">
            <div className="flex justify-between font-metric-mono-sm text-metric-mono-sm">
              <span className="text-on-surface-variant">Occupied Intensity Range</span>
              <span className="font-medium text-primary">[k_min: {lo}, k_max: {hi}]</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded bg-surface-container-lowest">
              <div
                className="absolute inset-y-0 rounded bg-gradient-to-r from-primary via-secondary to-tertiary opacity-80"
                style={{ left: `${(lo / 256) * 100}%`, width: `${((hi - lo + 1) / 256) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex w-full items-start gap-space-sm rounded-lg bg-surface-container-low p-space-sm lg:w-1/2">
            <Icon name="info" className="mt-0.5 shrink-0 text-[20px] text-tertiary" />
            <p className="font-body-sm text-body-sm leading-snug text-on-surface-variant">
              <strong className="font-medium text-on-surface">DIP Principle:</strong> The histogram represents the
              probability density distribution of pixel intensity values from 0 (pure black) to 255 (saturation white). It
              provides direct analytical metrics for dynamic range expansion, clipping, and auto-equalization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
