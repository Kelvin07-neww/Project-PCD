import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/cx";

interface StatTileProps {
  icon: string;
  iconClassName?: string;
  value: string;
  label: string;
}

export function StatTile({ icon, iconClassName, value, label }: StatTileProps) {
  return (
    <Card tone="low" className="flex flex-col items-center p-space-md text-center">
      <Icon name={icon} className={cx("mb-1 text-[22px]", iconClassName)} />
      <span className="font-headline-md text-headline-md text-on-surface">{value}</span>
      <span className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{label}</span>
    </Card>
  );
}
