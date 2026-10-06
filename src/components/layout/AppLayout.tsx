import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Icon } from "@/components/ui/Icon";
import { APP_FULL_TITLE, APP_NAME } from "@/data/app";
import { NAV_ITEMS, ROUTES } from "@/data/navItems";

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] w-full items-center justify-center gap-space-sm font-metric-mono-sm text-metric-mono-sm text-on-surface-variant"
    >
      <Icon name="progress_activity" className="animate-spin text-[20px] text-primary" />
      <span>Memuat modul…</span>
    </div>
  );
}

export function AppLayout() {
  const { pathname } = useLocation();

  // Scroll ke atas + judul tab mengikuti halaman aktif
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });

    const current = NAV_ITEMS.find((item) => item.path === pathname);
    if (!current) {
      document.title = `Tidak ditemukan | ${APP_NAME}`;
    } else if (current.path === ROUTES.home) {
      document.title = APP_FULL_TITLE;
    } else {
      document.title = `${current.label} | ${APP_NAME}`;
    }
  }, [pathname]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-[60] rounded bg-primary-container px-space-md py-space-sm font-label-lg text-label-lg text-on-primary-container focus:not-sr-only focus:fixed focus:left-space-md focus:top-space-md"
      >
        Lewati ke konten
      </a>

      <Navbar />

      <main
        id="main-content"
        tabIndex={-1}
        className="relative min-h-screen w-full bg-background pt-16 outline-none"
      >
        <div className="flex w-full flex-col">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}
