import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { TONE_CLASSES, type PillarMeta } from "@/data/home";
import { cx } from "@/lib/cx";

interface PillarCardProps {
  pillar: PillarMeta;
  /** Visual khas tiap pilar (chip filter, waveform, plot spektral). */
  children: ReactNode;
  /** Konten kiri footer (default: footerNote teks mono). */
  footerLeft?: ReactNode;
}

export function PillarCard({ pillar, children, footerLeft }: PillarCardProps) {
  const tone = TONE_CLASSES[pillar.tone];

  return (
    <Card
      tone="low"
      className="group relative flex flex-col justify-between rounded-2xl p-space-xl shadow-lg transition-all duration-300 hover:bg-surface-container hover:shadow-2xl"
    >
      <div>
        <div className="mb-space-lg flex items-center justify-between">
          <div
            className={cx(
              "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm",
              tone.iconBox,
            )}
          >
            <Icon name={pillar.icon} className="text-[28px]" />
          </div>
          <span
            className={cx(
              "rounded bg-surface-container-highest px-2 py-1 font-metric-mono-sm text-metric-mono-sm",
              tone.categoryText,
            )}
          >
            {pillar.category}
          </span>
        </div>

        <h3 className="mb-space-sm font-headline-lg text-headline-lg text-on-surface">{pillar.title}</h3>
        <p className="mb-space-lg font-body-md text-body-md text-on-surface-variant">{pillar.description}</p>

        {children}
      </div>

      <div className="flex w-full items-center justify-between border-t border-outline-variant/20 pt-4">
        {footerLeft ?? (
          <span className="font-metric-mono-sm text-metric-mono-sm text-on-surface-variant">
            {pillar.footerNote}
          </span>
        )}
        <Link
          to={pillar.linkTo}
          className={cx(
            "inline-flex items-center gap-1 rounded font-label-lg text-label-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/70",
            tone.link,
          )}
        >
          <span>{pillar.linkLabel}</span>
          <Icon name="chevron_right" className="text-[16px]" />
        </Link>
      </div>
    </Card>
  );
}
