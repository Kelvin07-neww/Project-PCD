import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { ROUTES } from "@/data/navItems";

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] w-full items-center justify-center px-margin py-space-xl">
      <div className="flex max-w-md flex-col items-center gap-space-md rounded-2xl bg-surface-container-low p-space-xl text-center shadow-xl">
        <span className="font-metric-mono-lg text-metric-mono-lg text-tertiary">ERROR 404</span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Halaman tidak ditemukan</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          The route you requested does not exist in this lab.
        </p>
        <Link
          to={ROUTES.home}
          className="inline-flex items-center gap-space-sm rounded-full bg-primary-container px-space-lg py-2.5 font-label-lg text-label-lg text-on-primary-container shadow-[0_0_24px_-2px_rgba(77,142,255,0.45)] transition-all hover:bg-primary-container/90"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          <span>Kembali ke Home</span>
        </Link>
      </div>
    </section>
  );
}
