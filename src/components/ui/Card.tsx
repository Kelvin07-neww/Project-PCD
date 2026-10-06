import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export type CardTone = "lowest" | "low" | "base" | "high";

const TONES: Record<CardTone, string> = {
  lowest: "bg-surface-container-lowest",
  low: "bg-surface-container-low",
  base: "bg-surface-container",
  high: "bg-surface-container-high",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
}

/** Permukaan tonal tanpa border tebal (layering via warna surface-container-*). */
export function Card({ tone = "low", className, children, ...rest }: CardProps) {
  return (
    <div className={cx("rounded-xl shadow-sm", TONES[tone], className)} {...rest}>
      {children}
    </div>
  );
}
