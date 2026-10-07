import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { ROUTES } from "@/data/navItems";
import { clearPhotos, listPhotos, removePhoto, type GalleryItem } from "@/lib/gallery";
import { cx } from "@/lib/cx";

const FILTER_LABEL: Record<string, string> = {
  none: "Original",
  grayscale: "Grayscale",
  invert: "Invert",
  sepia: "Sepia",
  warm: "Warm",
  cool: "Cool",
  threshold: "Threshold",
  posterize: "Posterize",
  pixelate: "Pixelate",
  blur: "Blur",
  sharpen: "Sharpen",
  emboss: "Emboss",
  "none-video-frame": "Frame Video",
  "grayscale-video-frame": "Frame Grayscale",
  "invert-video-frame": "Frame Invert",
  "sepia-video-frame": "Frame Sepia",
  "warm-video-frame": "Frame Warm",
  "cool-video-frame": "Frame Cool",
  "threshold-video-frame": "Frame Threshold",
  "posterize-video-frame": "Frame Posterize",
  "pixelate-video-frame": "Frame Pixelate",
  "blur-video-frame": "Frame Blur",
  "sharpen-video-frame": "Frame Sharpen",
  "emboss-video-frame": "Frame Emboss",
  "canny-video-frame": "Frame Canny",
  "sobel-video-frame": "Frame Sobel",
  "prewitt-video-frame": "Frame Prewitt",
  "otsu-video-frame": "Frame Otsu",
  canny: "Canny",
  sobel: "Sobel",
  prewitt: "Prewitt",
  otsu: "Otsu",
  edited: "Edited",
};
const fmt = (t: number) => new Date(t).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

const btn = "flex items-center gap-1 rounded-lg px-space-sm py-1.5 font-label-md text-label-md transition-colors";

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState<GalleryItem | null>(null);
  const [confirmId, setConfirmId] = useState<number | "all" | null>(null);

  const refresh = useCallback(async () => {
    try { setItems(await listPhotos()); setError(false); } catch { setItems([]); setError(true); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const doDelete = async () => {
    try {
      if (confirmId === "all") await clearPhotos();
      else if (confirmId !== null) await removePhoto(confirmId);
    } catch { setError(true); }
    setConfirmId(null);
    setOpen(null);
    await refresh();
  };

  const download = (it: GalleryItem) => {
    const a = document.createElement("a");
    a.href = it.url;
    a.download = `pixelbooth-${it.id}.${it.url.startsWith("data:image/png") ? "png" : "jpg"}`;
    a.click();
  };

  return (
    <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-space-lg px-margin-mobile py-space-xl sm:px-margin">
      <header className="flex flex-col justify-between gap-space-md sm:flex-row sm:items-end">
        <div>
          <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">Gallery</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {items ? `${items.length} foto tersimpan di browser ini.` : "Memuat..."} Foto hanya ada di perangkat ini dan hilang jika data browser dihapus.
          </p>
        </div>
        {items && items.length > 0 && (
          <button type="button" onClick={() => setConfirmId("all")} className={cx(btn, "bg-surface-container-high text-error hover:bg-surface-container-highest")}>
            <Icon name="delete_sweep" className="text-[18px]" /> Hapus semua
          </button>
        )}
      </header>

      {error && <p role="alert" className="rounded-lg bg-error-container p-space-md font-body-md text-body-md text-on-error-container">Penyimpanan browser tidak bisa diakses (mode private atau diblok).</p>}

      {items && items.length === 0 && !error && (
        <div className="flex flex-col items-center gap-space-md rounded-2xl bg-surface-container-low p-space-xl text-center">
          <Icon name="photo_library" className="text-[40px] text-primary" />
          <p className="font-body-md text-body-md text-on-surface-variant">Belum ada foto. Foto dari Photo Booth otomatis masuk ke sini.</p>
          <Link to={ROUTES.photoBooth} className={cx(btn, "bg-primary-container text-on-primary-container")}>Buka Photo Booth</Link>
        </div>
      )}

      <ul className="grid grid-cols-2 gap-space-md md:grid-cols-3 xl:grid-cols-5">
        {items?.map((it) => (
          <li key={it.id} className="group flex flex-col overflow-hidden rounded-xl bg-surface-container-low shadow-sm">
            <button type="button" onClick={() => setOpen(it)} aria-label="Buka foto" className="relative aspect-[4/3] w-full bg-surface-container-lowest">
              <img src={it.url} alt={`Foto ${FILTER_LABEL[it.filter] ?? it.filter}, ${fmt(it.createdAt)}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
              <span className="absolute left-2 top-2 rounded bg-surface-container-lowest/85 px-1.5 py-0.5 font-metric-mono-sm text-metric-mono-sm text-tertiary">{FILTER_LABEL[it.filter] ?? it.filter}</span>
            </button>
            <div className="flex flex-col gap-space-xs p-space-sm">
              <span className="font-metric-mono-sm text-metric-mono-sm text-on-surface-variant">{fmt(it.createdAt)}</span>
              {confirmId === it.id ? (
                <div className="flex items-center gap-space-xs">
                  <button type="button" onClick={doDelete} className={cx(btn, "bg-error-container text-on-error-container")}>Ya, hapus</button>
                  <button type="button" onClick={() => setConfirmId(null)} className={cx(btn, "bg-surface-container-high text-on-surface")}>Batal</button>
                </div>
              ) : (
                <div className="flex items-center gap-space-xs">
                  <Link to={`${ROUTES.resultEdit}?id=${it.id}`} className={cx(btn, "bg-primary-container text-on-primary-container")}>Edit</Link>
                  <Link to={`${ROUTES.imageAnalysis}?id=${it.id}`} className={cx(btn, "bg-surface-container-high text-on-surface")}>Analisis</Link>
                  <Link to={`${ROUTES.fourierSpectrum}?id=${it.id}`} aria-label="Analisis Fourier" className={cx(btn, "bg-surface-container-high text-secondary")}><Icon name="graphic_eq" className="text-[18px]" /></Link>
                  <button type="button" onClick={() => download(it)} aria-label="Unduh" className={cx(btn, "bg-surface-container-high text-on-surface")}><Icon name="download" className="text-[18px]" /></button>
                  <button type="button" onClick={() => setConfirmId(it.id)} aria-label="Hapus" className={cx(btn, "bg-surface-container-high text-error")}><Icon name="delete" className="text-[18px]" /></button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Pratinjau foto" onClick={() => setOpen(null)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-surface-container-lowest/90 p-space-lg backdrop-blur-md">
          <div className="flex max-h-full max-w-5xl flex-col gap-space-sm" onClick={(e) => e.stopPropagation()}>
            <img src={open.url} alt="Pratinjau foto" className="max-h-[78vh] rounded-xl object-contain shadow-2xl" />
            <div className="flex items-center justify-between gap-space-sm">
              <span className="font-metric-mono-sm text-metric-mono-sm text-on-surface-variant">{FILTER_LABEL[open.filter] ?? open.filter} · {fmt(open.createdAt)}</span>
              <div className="flex flex-wrap justify-end gap-space-xs">
                <Link to={`${ROUTES.resultEdit}?id=${open.id}`} className={cx(btn, "bg-primary-container text-on-primary-container")}>Edit</Link>
                <Link to={`${ROUTES.imageAnalysis}?id=${open.id}`} className={cx(btn, "bg-surface-container-high text-on-surface")}>Analisis</Link>
                <Link to={`${ROUTES.fourierSpectrum}?id=${open.id}`} className={cx(btn, "bg-surface-container-high text-secondary")}>Fourier</Link>
                <button type="button" autoFocus onClick={() => setOpen(null)} className={cx(btn, "bg-surface-container-high text-on-surface")}><Icon name="close" className="text-[18px]" /> Tutup (Esc)</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmId === "all" && (
        <div role="alertdialog" aria-modal="true" aria-label="Konfirmasi hapus semua" className="fixed inset-0 z-[80] flex items-center justify-center bg-surface-container-lowest/80 p-space-lg backdrop-blur-sm">
          <div className="flex max-w-sm flex-col gap-space-md rounded-2xl bg-surface-container p-space-xl shadow-2xl">
            <h2 className="font-headline-md text-headline-md text-on-surface">Hapus semua foto?</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Semua foto di Gallery akan dihapus dan tidak bisa dikembalikan.</p>
            <div className="flex justify-end gap-space-sm">
              <button type="button" autoFocus onClick={() => setConfirmId(null)} className={cx(btn, "bg-surface-container-high text-on-surface")}>Batal</button>
              <button type="button" onClick={doDelete} className={cx(btn, "bg-error-container text-on-error-container")}>Hapus semua</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
