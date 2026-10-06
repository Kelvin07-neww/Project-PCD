import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";
import type { FilterShape, FilterType } from "@/lib/dip/fft";

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

function Segmented<T extends string>({ label, value, options, onChange, disabled }: SegmentedProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">{label}</span>
      <div role="group" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-surface-container-lowest p-1">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
            className={cx(
              "rounded px-space-sm py-1 font-label-md text-label-md outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary/70 disabled:opacity-40",
              value === option.id
                ? "bg-primary-container font-semibold text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Slider({
  label,
  valueLabel,
  min,
  max,
  value,
  onChange,
  disabled,
}: {
  label: string;
  valueLabel: ReactNode;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between font-metric-mono-sm text-metric-mono-sm">
        <span className="uppercase text-on-surface-variant">{label}</span>
        <span className="font-bold text-primary">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-lowest accent-primary disabled:opacity-40"
      />
    </div>
  );
}

interface FourierControlsProps {
  type: FilterType;
  shape: FilterShape;
  d0: number;
  order: number;
  maxD0: number;
  onType: (v: FilterType) => void;
  onShape: (v: FilterShape) => void;
  onD0: (v: number) => void;
  onOrder: (v: number) => void;
}

export function FourierControls({ type, shape, d0, order, maxD0, onType, onShape, onD0, onOrder }: FourierControlsProps) {
  const off = type === "none";
  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-sm">
      <div className="flex items-center gap-1.5">
        <Icon name="tune" className="text-[18px] text-tertiary" />
        <span className="font-headline-md text-headline-md text-on-surface">Filter Frekuensi</span>
      </div>
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-4">
        <Segmented
          label="Jenis filter"
          value={type}
          onChange={onType}
          options={[
            { id: "none", label: "Tidak ada" },
            { id: "low", label: "Low-pass" },
            { id: "high", label: "High-pass" },
          ]}
        />
        <Segmented
          label="Fungsi transfer"
          value={shape}
          onChange={onShape}
          disabled={off}
          options={[
            { id: "ideal", label: "Ideal" },
            { id: "butterworth", label: "Butterworth" },
            { id: "gaussian", label: "Gaussian" },
          ]}
        />
        <Slider label="Cutoff D₀" valueLabel={`${d0} px`} min={1} max={maxD0} value={d0} onChange={onD0} disabled={off} />
        <Slider
          label="Orde Butterworth n"
          valueLabel={`n = ${order}`}
          min={1}
          max={8}
          value={order}
          onChange={onOrder}
          disabled={off || shape !== "butterworth"}
        />
      </div>
    </div>
  );
}
