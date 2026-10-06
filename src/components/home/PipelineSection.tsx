import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card, type CardTone } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { PIPELINE_TECHNIQUES } from "@/data/home";
import { SOBEL_GX, formatKernelValue } from "@/data/kernels";
import { cx } from "@/lib/cx";

interface PipelineStageProps {
  label: string;
  icon: string;
  /** Class warna teks untuk label & ikon, mis. "text-primary". */
  accentClassName: string;
  title: string;
  description: string;
  cardTone: CardTone;
  children: ReactNode;
}

function PipelineStage({
  label,
  icon,
  accentClassName,
  title,
  description,
  cardTone,
  children,
}: PipelineStageProps) {
  return (
    <Card tone={cardTone} className="relative flex flex-col p-space-lg">
      <div className="mb-space-md flex items-center justify-between">
        <span className={cx("font-metric-mono-sm text-metric-mono-sm uppercase", accentClassName)}>
          {label}
        </span>
        <Icon name={icon} className={cx("text-[20px]", accentClassName)} />
      </div>
      <h4 className="mb-space-xs font-headline-md text-headline-md text-on-surface">{title}</h4>
      <p className="mb-space-md font-body-sm text-body-sm text-on-surface-variant">{description}</p>
      {children}
    </Card>
  );
}

function KernelPreview() {
  return (
    <div className="mt-auto rounded bg-surface-container-lowest p-2.5">
      <div className="mb-1 flex justify-between font-metric-mono-sm text-[10px] text-on-surface-variant">
        <span>
          OPERATOR SOBEL G<sub>x</sub>
        </span>
        <span className="text-secondary">TENSOR 3×3</span>
      </div>
      <div className="grid grid-cols-3 gap-1 text-center font-metric-mono-sm text-[11px]">
        {SOBEL_GX.flatMap((row, r) =>
          row.map((value, c) => {
            const isCenter = r === 1 && c === 1;
            return (
              <div
                key={`${r}-${c}`}
                className={cx(
                  "rounded p-1",
                  isCenter
                    ? "bg-secondary-container/40 font-bold text-secondary"
                    : "bg-surface-container text-on-surface",
                )}
              >
                {formatKernelValue(value)}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

export function PipelineSection() {
  return (
    <section className="relative w-full overflow-hidden bg-surface-container-lowest py-24">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(#424754_1px,transparent_1px)] opacity-15 [background-size:24px_24px]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-margin-mobile sm:px-margin">
        <div className="mb-16 max-w-3xl">
          <Chip
            icon="school"
            className="mb-space-sm bg-secondary-container/20 px-3 py-1 font-label-md text-label-md text-secondary"
          >
            <span>Ideal untuk Penggemar Fotografi & Mahasiswa Computer Vision</span>
          </Chip>
          <h2 className="mt-2 font-headline-xl text-headline-xl tracking-tight text-on-surface">
            Dari Foton Sensor ke Koordinat Frekuensi Diskret
          </h2>
          <p className="mt-space-sm font-body-lg text-body-lg text-on-surface-variant">
            PixelBooth menampilkan seluruh stack komputasi. Lacak setiap piksel dari input sensor kamera mentah
            melalui konvolusi spasial linear hingga rendering fragmen GLSL berkecepatan tinggi.
          </p>
        </div>

        <div className="w-full rounded-2xl bg-surface-container p-space-lg shadow-xl sm:p-space-xl">
          <div className="relative grid grid-cols-1 gap-space-lg md:grid-cols-3">
            <PipelineStage
              label="Tahap 01 • Akuisisi"
              icon="photo_camera"
              accentClassName="text-primary"
              title="Input Domain Spasial"
              description="Pengambilan frame WebRTC langsung pada 1080p. Interpolasi Bayer sRGB mentah dipetakan ke buffer float 32-bit berpresisi tinggi."
              cardTone="low"
            >
              <div className="mt-auto rounded bg-surface-container-lowest p-2.5 font-metric-mono-sm text-[11px] text-tertiary-fixed-dim">
                f(x, y) ∈ [0, 255]<sup>W × H</sup>
                <br />
                λ<sub>RGB</sub> Normalisasi: [0.0, 1.0]
              </div>
            </PipelineStage>

            <PipelineStage
              label="Tahap 02 • Transformasi"
              icon="grid_on"
              accentClassName="text-secondary"
              title="Kernel Matematis"
              description="Filtering matriks spasial 3×3 hingga 7×7 yang dapat dikonfigurasi: Sobel, Laplacian, Blur Gaussian, Box Sharpen, dan turunan arah."
              cardTone="high"
            >
              <KernelPreview />
            </PipelineStage>

            <PipelineStage
              label="Tahap 03 • Render"
              icon="terminal"
              accentClassName="text-tertiary"
              title="Output Shader GLSL"
              description="Rasterisasi fragment shader dikompilasi langsung ke inti GPU. Rendering latensi nol dengan umpan balik telemetri histogram live."
              cardTone="low"
            >
              <div className="mt-auto rounded bg-surface-container-lowest p-2.5 font-metric-mono-sm text-[11px] text-tertiary">
                gl_FragColor = vec4(clamp(
                <br />
                &nbsp;&nbsp;convSum * gain, 0.0, 1.0
                <br />
                ), 1.0); // 60 FPS SYNC
              </div>
            </PipelineStage>
          </div>

          <div className="mt-space-lg flex flex-wrap items-center justify-between gap-space-md border-t border-outline-variant/30 pt-space-lg font-metric-mono-sm text-metric-mono-sm text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>INTEGRITAS PIPELINE: NUMERIK 100% BIT-EXACT</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {PIPELINE_TECHNIQUES.map((technique, index) => (
                <span key={technique.label} className="flex items-center gap-4">
                  {index > 0 && <span aria-hidden="true">•</span>}
                  <Link
                    to={technique.to}
                    className={cx(
                      "rounded outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/70",
                      technique.hover,
                    )}
                  >
                    {technique.label}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
