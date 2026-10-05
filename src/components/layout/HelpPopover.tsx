import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { NAV_ITEMS } from "@/data/navItems";

export function HelpPopover() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        icon="help_outline"
        label="Manual & page guide"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      />

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Page guide"
          className="absolute right-0 top-full mt-space-sm w-72 rounded-xl border border-outline-variant/30 bg-surface-container-high/95 p-space-md shadow-2xl backdrop-blur-xl"
        >
          <p className="mb-space-sm font-metric-mono-sm text-metric-mono-sm uppercase text-tertiary">
            Page guide
          </p>
          <ul className="flex flex-col gap-space-xs">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-space-sm rounded-lg p-space-sm transition-colors hover:bg-surface-container-highest"
                >
                  <Icon name={item.icon} className="mt-0.5 text-[18px] text-primary" />
                  <span className="flex flex-col">
                    <span className="font-label-lg text-label-lg text-on-surface">{item.label}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-space-sm border-t border-outline-variant/30 pt-space-sm font-metric-mono-sm text-metric-mono-sm text-outline">
            Press Esc to close menus.
          </p>
        </div>
      )}
    </div>
  );
}
