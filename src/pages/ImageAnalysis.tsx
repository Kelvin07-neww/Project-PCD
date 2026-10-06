import { useCallback, useEffect, useState } from "react";
import { ChannelSection } from "@/components/analysis/ChannelSection";
import { FourierPrimer } from "@/components/analysis/FourierPrimer";
import { KernelInspector } from "@/components/analysis/KernelInspector";
import { LabHeader } from "@/components/analysis/LabHeader";
import { MetricsRibbon } from "@/components/analysis/MetricsRibbon";
import { TransformSection } from "@/components/analysis/TransformSection";
import { ViewportPair } from "@/components/analysis/ViewportPair";
import { Icon } from "@/components/ui/Icon";
import { useAnalysisImage } from "@/hooks/useAnalysisImage";
import { downloadText } from "@/lib/download";
import { analyzeImage, type Analysis } from "@/lib/dip/analyze";
import { buildReportCsv } from "@/lib/dip/report";

export default function ImageAnalysis() {
  const { image, loading, notice, loadTest, loadFile } = useAnalysisImage();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);

  // Analisis otomatis tiap gambar baru
  useEffect(() => {
    setAnalysis(image ? analyzeImage(image.pixels) : null);
  }, [image]);

  const runDiagnostics = useCallback(() => {
    if (!image) return;
    setBusy(true);
    // beri browser satu frame untuk menampilkan status "Computing…"
    window.setTimeout(() => {
      setAnalysis(analyzeImage(image.pixels));
      setBusy(false);
    }, 40);
  }, [image]);

  const exportReport = useCallback(() => {
    if (!image || !analysis) return;
    downloadText("pixelbooth-lab-report.csv", buildReportCsv(image, analysis));
  }, [image, analysis]);

  return (
    <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-space-xl px-margin-mobile py-space-xl sm:px-margin">
      <LabHeader
        sourceLabel={image?.label ?? "loading…"}
        busy={busy}
        disabled={!image || !analysis}
        onPickFile={loadFile}
        onUseTest={loadTest}
        onRun={runDiagnostics}
        onExport={exportReport}
      />

      {notice && (
        <div role="status" className="flex items-start gap-space-sm rounded-lg bg-surface-container-low p-space-md font-body-sm text-body-sm text-on-surface-variant">
          <Icon name="info" className="mt-0.5 shrink-0 text-[18px] text-tertiary" />
          <span>{notice}</span>
        </div>
      )}

      {!image || !analysis ? (
        <div role="status" aria-live="polite" className="flex min-h-[40vh] items-center justify-center gap-space-sm font-metric-mono-sm text-metric-mono-sm text-on-surface-variant">
          <Icon name="progress_activity" className="animate-spin text-[20px] text-primary motion-reduce:animate-none" />
          <span>{loading ? "Loading image…" : "No image loaded"}</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-space-md">
            <MetricsRibbon image={image} analysis={analysis} />
            <ViewportPair image={image} analysis={analysis} />
          </div>
          <ChannelSection analysis={analysis} />
          <TransformSection pixels={image.pixels} analysis={analysis} />
          <FourierPrimer />
          <KernelInspector analysis={analysis} />
        </>
      )}
    </div>
  );
}
