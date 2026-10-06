import { cx } from "@/lib/cx";

interface ThirdsGridProps {
  /** Class border + opacity, mis. "border-primary/40". */
  lineClassName?: string;
  className?: string;
}

const CELLS = Array.from({ length: 9 }, (_, index) => ({
  right: index % 3 < 2,
  bottom: Math.floor(index / 3) < 2,
}));

/** Overlay rule-of-thirds 3×3. Tidak menerima pointer event. */
export function ThirdsGrid({ lineClassName = "border-primary/40", className }: ThirdsGridProps) {
  return (
    <div
      aria-hidden="true"
      className={cx("pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3", className)}
    >
      {CELLS.map((cell, index) => (
        <div
          key={index}
          className={cx(cell.right && "border-r", cell.bottom && "border-b", lineClassName)}
        />
      ))}
    </div>
  );
}
