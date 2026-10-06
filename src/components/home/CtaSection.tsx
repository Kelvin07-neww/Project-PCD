import { ButtonLink } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ROUTES } from "@/data/navItems";

export function CtaSection() {
  return (
    <section className="relative w-full bg-surface py-20">
      <div className="mx-auto w-full max-w-5xl px-margin-mobile text-center sm:px-margin">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-surface-container-high via-surface-container to-surface-container-low p-space-xl shadow-2xl sm:p-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-container/20 blur-[100px]"
          />

          <div className="relative z-10 mx-auto max-w-2xl">
            <Chip
              icon="videocam"
              iconClassName="text-[15px]"
              className="mb-space-md bg-surface-container-highest px-3 py-1 font-metric-mono-sm text-metric-mono-sm text-tertiary-fixed"
            >
              SIAP UNTUK PENGAMBILAN
            </Chip>
            <h2 className="mb-space-sm font-headline-xl text-headline-xl tracking-tight text-on-surface">
              Masuk ke Studio Ilmiah
            </h2>
            <p className="mb-space-lg font-body-lg text-body-lg text-on-surface-variant">
              Hubungkan webcam Anda, terapkan kernel konvolusi real-time, inspeksi spektrum frekuensi 2D,
              dan ekspor visual resolusi tinggi yang siap dipublikasikan.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-space-md">
              <ButtonLink
                to={ROUTES.photoBooth}
                variant="primary"
                size="lg"
                icon="photo_camera"
                className="px-space-xl font-semibold"
              >
                Buka Studio PhotoBooth
              </ButtonLink>
              <ButtonLink to={ROUTES.resultEdit} variant="tonal" size="lg" icon="tune">
                Buka Editor Gambar
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
