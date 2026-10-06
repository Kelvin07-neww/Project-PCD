import { Icon } from "@/components/ui/Icon";
import { APP_BUILD, APP_NAME, APP_ORG, FOOTER_BADGES } from "@/data/app";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-outline-variant/30 bg-surface-container-lowest py-space-xl">
      <div className="flex w-full flex-col items-center justify-between gap-space-md px-margin-mobile font-body-sm text-body-sm text-on-surface-variant sm:px-margin md:flex-row">
        <div className="flex items-center gap-space-md">
          <span className="font-headline-md text-headline-md text-on-surface">{APP_NAME}</span>
          <span className="font-metric-mono-sm text-metric-mono-sm text-outline">{APP_BUILD}</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-space-lg font-metric-mono-sm text-metric-mono-sm">
          {FOOTER_BADGES.map((badge) => (
            <span key={badge.label} className="flex items-center gap-1">
              <Icon name={badge.icon} className={`text-[14px] ${badge.iconClassName}`} />
              {badge.label}
            </span>
          ))}
        </div>

        <div className="text-center font-metric-mono-sm text-metric-mono-sm text-outline md:text-right">
          © {year} {APP_ORG}. Hak Cipta Dilindungi.
        </div>
      </div>
    </footer>
  );
}
