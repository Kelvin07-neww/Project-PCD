import type { CSSProperties, HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Nama ikon Material Symbols Outlined, mis. "photo_camera". */
  name: string;
  /** Ikon terisi (FILL 1). */
  fill?: boolean;
  /** Jika diberikan, ikon dianggap bermakna dan diberi aria-label. Jika tidak, disembunyikan dari screen reader. */
  label?: string;
}

export function Icon({ name, fill = false, label, className, style, ...rest }: IconProps) {
  const mergedStyle: CSSProperties = {
    fontVariationSettings: `'FILL' ${fill ? 1 : 0}`,
    ...style,
  };

  return (
    <span
      className={cx("material-symbols-outlined select-none", className)}
      style={mergedStyle}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      {name}
    </span>
  );
}
