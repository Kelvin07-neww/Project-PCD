import { useEffect, useId, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { HelpPopover } from "@/components/layout/HelpPopover";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { APP_NAME, APP_TAGLINE } from "@/data/app";
import { LOGO_URL } from "@/data/assets";
import { NAV_ITEMS, ROUTES } from "@/data/navItems";
import { useFullscreen } from "@/hooks/useFullscreen";
import { cx } from "@/lib/cx";

const DESKTOP_LINK_BASE = "px-space-md py-1.5 rounded font-label-lg text-label-lg transition-colors";
const ACTIVE_CLASSES =
  "bg-surface-container-high text-primary font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]";
const INACTIVE_CLASSES =
  "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const { pathname } = useLocation();
  const { isFullscreen, toggle: toggleFullscreen, supported: fullscreenSupported } = useFullscreen();

  // Tutup menu mobile saat pindah halaman
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Tutup menu mobile dengan Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-outline-variant/30 bg-surface-container-lowest/85 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <div className="flex h-16 w-full items-center justify-between gap-gutter px-margin-mobile sm:px-margin">
        {/* Brand */}
        <div className="flex shrink-0 items-center gap-space-md">
          <Link
            to={ROUTES.home}
            aria-label={`${APP_NAME} home`}
            className="flex items-center gap-space-sm rounded outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <img
              alt=""
              src={LOGO_URL}
              className="h-8 w-auto object-contain"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md tracking-tight text-on-surface">
                {APP_NAME}
              </span>
              <span className="font-metric-mono-sm text-metric-mono-sm leading-none text-on-surface-variant">
                {APP_TAGLINE}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigasi tengah (xl+) */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-space-xs rounded-lg border border-outline-variant/30 bg-surface-container-low/90 px-space-xs py-1 xl:flex"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === ROUTES.home}
              className={({ isActive }) =>
                cx(DESKTOP_LINK_BASE, isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES)
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Aksi kanan */}
        <div className="flex shrink-0 items-center">
          <div className="flex items-center gap-space-xs">
            <Link
              to={ROUTES.photoBooth}
              className="hidden items-center gap-1 rounded bg-primary-container px-space-md py-1.5 font-label-lg text-label-lg text-on-primary-container shadow-[0_0_16px_-2px_rgba(77,142,255,0.4)] transition-all hover:bg-primary-container/85 sm:inline-flex"
            >
              <Icon name="photo_camera" className="text-[16px]" />
              <span>Capture Studio</span>
            </Link>

            {fullscreenSupported && (
              <IconButton
                icon={isFullscreen ? "fullscreen_exit" : "fullscreen"}
                label={isFullscreen ? "Exit fullscreen" : "Toggle fullscreen"}
                aria-pressed={isFullscreen}
                onClick={toggleFullscreen}
              />
            )}

            <HelpPopover />

            <IconButton
              icon={menuOpen ? "close" : "menu"}
              label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="xl:hidden"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((value) => !value)}
            />
          </div>
        </div>
      </div>

      {/* Menu mobile / tablet (di bawah xl) */}
      {menuOpen && (
        <nav
          id={menuId}
          aria-label="Mobile"
          className="border-t border-outline-variant/30 bg-surface-container-lowest/95 px-margin-mobile py-space-md backdrop-blur-xl sm:px-margin xl:hidden"
        >
          <ul className="flex flex-col gap-space-xs">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.path === ROUTES.home}
                  className={({ isActive }) =>
                    cx(
                      "flex items-center gap-space-sm rounded-lg px-space-md py-2.5 font-label-lg text-label-lg transition-colors",
                      isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES,
                    )
                  }
                >
                  <Icon name={item.icon} className="text-[20px]" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
