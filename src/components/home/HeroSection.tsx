import { CannyModule, FftModule } from "@/components/home/FloatingModules";
import { ViewportMockup } from "@/components/home/ViewportMockup";
import { ButtonLink } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StatTile } from "@/components/ui/StatTile";
import { CAPABILITY_STATS, HERO_EYEBROW } from "@/data/home";
import { ROUTES } from "@/data/navItems";

export function HeroSection() {
  return (
    <section className="relative -mt-16 w-full overflow-hidden bg-surface-container-lowest pb-20 pt-24">
      {/* Ambient illumination */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-[550px] w-[1100px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary-container/20 via-secondary-container/15 to-transparent blur-[140px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-48 top-1/3 h-96 w-96 rounded-full bg-tertiary-container/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-48 top-1/2 h-[420px] w-[420px] rounded-full bg-secondary-container/15 blur-[130px]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-margin-mobile sm:px-margin">
        {/* Eyebrow */}
        <div className="mb-space-lg flex items-center justify-center">
          <Chip
            dotClassName="bg-tertiary shadow-[0_0_8px_#7bd0ff] animate-ping motion-reduce:animate-none"
            className="flex-wrap justify-center gap-2 bg-surface-container/80 px-space-md py-1 shadow-md backdrop-blur-md"
          >
            <span className="font-metric-mono-sm text-metric-mono-sm uppercase tracking-wide text-tertiary-fixed">
              {HERO_EYEBROW.badge}
            </span>
            <span className="hidden text-outline-variant sm:inline">•</span>
            <span className="hidden font-label-md text-label-md text-on-surface-variant sm:inline">
              {HERO_EYEBROW.caption}
            </span>
          </Chip>
        </div>

        {/* Headline */}
        <div className="mx-auto mb-space-xl max-w-4xl text-center">
          <h1 className="mb-space-md font-headline-xl text-headline-xl tracking-tight text-on-surface sm:text-[48px] sm:leading-[56px]">
            Ubah Setiap Momen Menjadi{" "}
            <span className="bg-gradient-to-r from-primary via-tertiary to-secondary bg-clip-text text-transparent">
              Foto Kreatif.
            </span>
          </h1>
          <p className="mx-auto max-w-2xl font-body-lg text-body-lg font-normal text-on-surface-variant">
            Ambil foto Anda, eksplorasi filter kreatif, dan temukan apa yang terjadi di dalam
            gambar — memadukan estetika studio dengan computer vision akademik.
          </p>

          <div className="mt-space-lg flex flex-wrap items-center justify-center gap-space-md">
            <ButtonLink
              to={ROUTES.photoBooth}
              variant="primary"
              icon="photo_camera"
              iconFill
              iconClassName="transition-transform group-hover:rotate-12"
              trailingIcon="arrow_forward"
              className="font-semibold tracking-wide"
            >
              Buka Photo Booth
            </ButtonLink>
            <ButtonLink
              to={ROUTES.imageAnalysis}
              variant="secondary"
              icon="blur_on"
              iconClassName="text-secondary"
              className="font-medium"
            >
              Jelajahi Pengolahan Citra
            </ButtonLink>
          </div>
        </div>

        {/* Viewport + floating modules */}
        <div className="relative mx-auto mt-space-xl w-full max-w-5xl">
          <ViewportMockup />
          <CannyModule />
          <FftModule />
        </div>

        {/* Capability strip */}
        <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-space-md pt-space-lg md:grid-cols-4">
          {CAPABILITY_STATS.map((stat) => (
            <StatTile key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
