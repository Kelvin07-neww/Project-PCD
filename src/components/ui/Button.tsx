import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";

export type ButtonVariant = "primary" | "secondary" | "tonal";
export type ButtonSize = "md" | "lg";

const BASE =
  "group relative inline-flex items-center gap-space-sm rounded-full px-space-lg font-label-lg text-label-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/70";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-container text-on-primary-container shadow-[0_0_24px_-2px_rgba(77,142,255,0.45)] hover:bg-primary-container/90 hover:shadow-[0_0_32px_0px_rgba(77,142,255,0.7)]",
  secondary:
    "bg-surface-container-high/90 text-on-surface shadow-sm backdrop-blur-md hover:bg-surface-variant hover:text-primary",
  tonal: "bg-surface-container-highest text-on-surface hover:text-primary",
};

const SIZES: Record<ButtonSize, string> = {
  md: "py-3",
  lg: "py-3.5",
};

function buttonClasses(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cx(BASE, VARIANTS[variant], SIZES[size], className);
}

interface ButtonContentProps {
  icon?: string;
  iconFill?: boolean;
  iconClassName?: string;
  trailingIcon?: string;
  children: ReactNode;
}

function ButtonContent({ icon, iconFill, iconClassName, trailingIcon, children }: ButtonContentProps) {
  return (
    <>
      {icon && <Icon name={icon} fill={iconFill} className={cx("text-[20px]", iconClassName)} />}
      <span>{children}</span>
      {trailingIcon && (
        <Icon
          name={trailingIcon}
          className="text-[16px] transition-transform group-hover:translate-x-0.5"
        />
      )}
    </>
  );
}

interface CommonProps extends ButtonContentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/** Tombol aksi (memicu handler). */
export function Button({
  variant = "primary",
  size = "md",
  className,
  icon,
  iconFill,
  iconClassName,
  trailingIcon,
  children,
  type = "button",
  ...rest
}: CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      <ButtonContent
        icon={icon}
        iconFill={iconFill}
        iconClassName={iconClassName}
        trailingIcon={trailingIcon}
      >
        {children}
      </ButtonContent>
    </button>
  );
}

/** Tombol bergaya sama, tetapi berupa <Link> react-router. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  icon,
  iconFill,
  iconClassName,
  trailingIcon,
  children,
  ...rest
}: CommonProps & Omit<LinkProps, "children" | "className">) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      <ButtonContent
        icon={icon}
        iconFill={iconFill}
        iconClassName={iconClassName}
        trailingIcon={trailingIcon}
      >
        {children}
      </ButtonContent>
    </Link>
  );
}
