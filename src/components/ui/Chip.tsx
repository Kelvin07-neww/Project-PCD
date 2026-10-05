import type { HTMLAttributes, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";

interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  children: ReactNode;
  /** Bentuk: pill (rounded-full) atau rect (rounded). */
  shape?: "pill" | "rect";
  /** Ikon Material Symbols di kiri. */
  icon?: string;
  iconClassName?: string;
  /** Class warna titik kecil di kiri (mis. "bg-amber-400"). */
  dotClassName?: string;
}

/** Label kecil: eyebrow, kategori, atau tag filter. Warna & ukuran diatur lewat className. */
export function Chip({
  children,
  shape = "pill",
  icon,
  iconClassName,
  dotClassName,
  className,
  ...rest
}: ChipProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5",
        shape === "pill" ? "rounded-full" : "rounded",
        className,
      )}
      {...rest}
    >
      {dotClassName && <span aria-hidden="true" className={cx("h-2 w-2 rounded-full", dotClassName)} />}
      {icon && <Icon name={icon} className={cx("text-[16px]", iconClassName)} />}
      {children}
    </span>
  );
}
