import { Icon } from "@/components/ui/Icon";

interface PagePlaceholderProps {
  title: string;
  icon: string;
  stage: "b" | "c" | "d" | "e" | "f";
}

/** SEMENTARA: dipakai halaman yang belum dikerjakan. Dihapus setelah tahapnya selesai. */
export function PagePlaceholder({ title, icon, stage }: PagePlaceholderProps) {
  return (
    <section className="w-full min-h-[60vh] px-margin py-space-xl flex items-center justify-center">
      <div className="max-w-md rounded-2xl bg-surface-container-low p-space-xl shadow-xl flex flex-col items-center gap-space-md text-center">
        <Icon name={icon} className="text-[40px] text-primary" />
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Route aktif. Halaman ini dibangun di tahap ({stage}).
        </p>
      </div>
    </section>
  );
}
