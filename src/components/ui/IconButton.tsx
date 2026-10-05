import type { ButtonHTMLAttributes } from "react";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";

interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label" | "title"> {
  icon: string;
  /** Wajib: dipakai untuk aria-label sekaligus tooltip. */
  label: string;
  fill?: boolean;
  iconClassName?: string;
}

export function IconButton({
  icon,
  label,
  fill,
  iconClassName = "text-[20px]",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={cx(
        "p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} fill={fill} className={iconClassName} />
    </button>
  );
}
