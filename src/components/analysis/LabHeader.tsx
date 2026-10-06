import { useRef, type ChangeEvent } from "react";
import { Icon } from "@/components/ui/Icon";

interface LabHeaderProps {
  sourceLabel: string;
  busy: boolean;
  disabled: boolean;
  onPickFile: (file: File) => void;
  onUseTest: () => void;
  onRun: () => void;
  onExport: () => void;
}

export function LabHeader({ sourceLabel, busy, disabled, onPickFile, onUseTest, onRun, onExport }: LabHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onPickFile(file);
    event.target.value = ""; // izinkan memilih file yang sama lagi
  };

  return (
    <div className="flex flex-col justify-between gap-space-lg lg:flex-row lg:items-end">
      <div className="flex max-w-4xl flex-col gap-space-xs">
        <div className="flex flex-wrap items-center gap-space-sm font-metric-mono-sm text-metric-mono-sm text-tertiary">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-tertiary motion-reduce:animate-none" />
          <span>SYSTEM ACTIVE / COMPUTATIONAL VISION ENGINE</span>
          <span className="text-outline">::</span>
          <span className="max-w-[260px] truncate text-on-surface-variant" title={sourceLabel}>
            SRC: {sourceLabel}
          </span>
        </div>
        <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
          Digital Image Processing Analysis Lab
        </h1>
        <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
          Understand your image beyond what you can see — analytical spatial metrics, color histograms,
          mathematical transformations, and frequency domain spectra.
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-space-sm">
        <input ref={inputRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={handleChange} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-space-xs rounded-lg bg-surface-container px-space-md py-2 font-label-lg text-label-lg text-on-surface shadow-sm transition-all hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary/70 outline-none"
        >
          <Icon name="photo_library" className="text-[18px] text-tertiary" />
          <span>Select Target Photo</span>
        </button>
        <button
          type="button"
          onClick={onUseTest}
          className="flex items-center gap-space-xs rounded-lg bg-surface-container px-space-md py-2 font-label-lg text-label-lg text-on-surface-variant shadow-sm transition-all hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary/70 outline-none"
        >
          <Icon name="science" className="text-[18px] text-secondary" />
          <span>Use Test Image</span>
        </button>
        <button
          type="button"
          onClick={onRun}
          disabled={disabled || busy}
          className="flex items-center gap-space-xs rounded-lg bg-primary px-space-md py-2 font-label-lg text-label-lg text-on-primary shadow-[0_0_20px_-2px_rgba(59,130,246,0.35)] transition-all hover:bg-primary-fixed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-primary/70 outline-none"
        >
          <Icon name={busy ? "refresh" : "biotech"} className={busy ? "animate-spin text-[18px] motion-reduce:animate-none" : "text-[18px]"} />
          <span>{busy ? "Computing…" : "Run Full Diagnostics"}</span>
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={disabled}
          className="flex items-center gap-space-xs rounded-lg bg-surface-container-high px-space-md py-2 font-label-lg text-label-lg text-on-surface-variant shadow-sm transition-all hover:bg-surface-container-highest hover:text-on-surface disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-primary/70 outline-none"
        >
          <Icon name="file_download" className="text-[18px] text-secondary" />
          <span>Export Lab Report (CSV)</span>
        </button>
      </div>
    </div>
  );
}
