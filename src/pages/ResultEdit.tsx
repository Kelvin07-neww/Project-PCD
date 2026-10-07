import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { ROUTES } from "@/data/navItems";
import { applyEdit, autoThreshold, DEFAULT_EDIT, type EditMode, type EditSettings } from "@/lib/edit";
import { addPhoto, getPhoto, listPhotos } from "@/lib/gallery";
import { cx } from "@/lib/cx";

const LAST_CAPTURE_KEY = "pixelbooth:last-capture";
const MODES: { id: EditMode; label: string }[] = [
  { id: "none", label: "Asli" },
  { id: "gray", label: "Grayscale" },
  { id: "negative", label: "Negatif" },
  { id: "sepia", label: "Sepia" },
  { id: "binary", label: "Biner" },
];

/** Gambar + rotasi/flip ke canvas; jika edited, terapkan applyEdit. maxSide membatasi ukuran (preview). */
function render(img: HTMLImageElement, canvas: HTMLCanvasElement, maxSide: number, s: EditSettings, edited: boolean) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const k = Math.min(1, maxSide / Math.max(iw, ih));
  const dw = Math.round(iw * k), dh = Math.round(ih * k);
  const turned = s.rotate % 180 !== 0;
  canvas.width = turned ? dh : dw;
  canvas.height = turned ? dw : dh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((s.rotate * Math.PI) / 180);
  if (s.flipH) ctx.scale(-1, 1);
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
  if (edited) {
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyEdit(d, s);
    ctx.putImageData(d, 0, 0);
  }
}

function Slider({ label, value, min, max, step = 1, onChange, format }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between font-metric-mono-sm text-metric-mono-sm">
        <span className="uppercase text-on-surface-variant">{label}</span>
        <span className="font-bold text-primary">{format ? format(value) : value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-primary" />
    </label>
  );
}

const chip = (on: boolean) =>
  cx("rounded-lg px-space-md py-1.5 font-label-lg text-label-lg transition-colors",
    on ? "bg-primary-container text-on-primary-container" : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest");

export default function ResultEdit() {
  const [params] = useSearchParams();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState<EditSettings>(DEFAULT_EDIT);
  const [split, setSplit] = useState(50);
  const [notice, setNotice] = useState("");
  const cOrig = useRef<HTMLCanvasElement>(null);
  const cEdit = useRef<HTMLCanvasElement>(null);
  const set = <K extends keyof EditSettings>(key: K, value: EditSettings[K]) => setS((v) => ({ ...v, [key]: value }));

  // Cari sumber: ?id= dari Gallery, lalu foto terakhir Photo Booth, lalu foto terbaru di Gallery
  useEffect(() => {
    let alive = true;
    (async () => {
      let url: string | null = null;
      try {
        const id = Number(params.get("id"));
        if (id) url = (await getPhoto(id))?.url ?? null;
        if (!url) url = localStorage.getItem(LAST_CAPTURE_KEY);
        if (!url) url = (await listPhotos())[0]?.url ?? null;
      } catch { /* storage diblok */ }
      if (!alive) return;
      if (!url) { setLoading(false); return; }
      const im = new Image();
      im.onload = () => { if (alive) { setImg(im); setLoading(false); } };
      im.src = url;
    })();
    return () => { alive = false; };
  }, [params]);

  useEffect(() => {
    if (!img || !cOrig.current || !cEdit.current) return;
    render(img, cOrig.current, 900, s, false);
    render(img, cEdit.current, 900, s, true);
  }, [img, s]);

  const exportFull = useCallback((type: string) => {
    const c = document.createElement("canvas");
    if (img) render(img, c, Infinity, s, true);
    return c.toDataURL(type, 0.92);
  }, [img, s]);

  const download = () => {
    const a = document.createElement("a");
    a.href = exportFull("image/png");
    a.download = `pixelbooth-edit-${Date.now()}.png`;
    a.click();
  };
  const saveToGallery = async () => {
    try {
      await addPhoto({ id: Date.now(), url: exportFull("image/jpeg"), filter: "edited", createdAt: Date.now() });
      setNotice("Tersimpan ke Gallery.");
    } catch { setNotice("Gagal menyimpan. Penyimpanan browser mungkin penuh atau diblok."); }
  };
  const otsuNow = () => {
    const ctx = cOrig.current?.getContext("2d");
    if (!ctx || !cOrig.current) return;
    set("threshold", autoThreshold(ctx.getImageData(0, 0, cOrig.current.width, cOrig.current.height)));
    set("mode", "binary");
  };

  if (!img) {
    return (
      <section className="flex min-h-[60vh] w-full items-center justify-center px-margin py-space-xl">
        <div className="flex max-w-md flex-col items-center gap-space-md rounded-2xl bg-surface-container-low p-space-xl text-center shadow-xl">
          <Icon name={loading ? "progress_activity" : "image_not_supported"} className={cx("text-[40px] text-primary", loading && "animate-spin")} />
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{loading ? "Memuat foto..." : "Belum ada foto"}</h1>
          {!loading && (
            <>
              <p className="font-body-md text-body-md text-on-surface-variant">Ambil foto di Photo Booth dulu, atau pilih foto dari Gallery.</p>
              <div className="flex gap-space-sm">
                <Link to={ROUTES.photoBooth} className={chip(true)}>Buka Photo Booth</Link>
                <Link to={ROUTES.gallery} className={chip(false)}>Buka Gallery</Link>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[1720px] grid-cols-1 gap-gutter px-margin-mobile py-space-xl sm:px-margin lg:grid-cols-12">
      <section className="flex flex-col gap-space-md lg:col-span-8">
        <div>
          <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">Result & Edit</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Geser garis untuk membandingkan sebelum dan sesudah.</p>
        </div>

        <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-surface-container-lowest shadow-2xl">
          <div className="relative max-h-[70vh]">
            <canvas ref={cEdit} className="block max-h-[70vh] w-auto max-w-full" />
            <canvas ref={cOrig} className="absolute inset-0 h-full w-full" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 bg-primary shadow-[0_0_8px_rgba(173,198,255,0.8)]" style={{ left: `${split}%` }} />
            <span className="absolute left-3 top-3 rounded bg-surface-container-lowest/80 px-2 py-0.5 font-metric-mono-sm text-metric-mono-sm text-on-surface">SEBELUM</span>
            <span className="absolute right-3 top-3 rounded bg-surface-container-lowest/80 px-2 py-0.5 font-metric-mono-sm text-metric-mono-sm text-primary">SESUDAH</span>
            <input type="range" min={0} max={100} value={split} aria-label="Posisi pembanding sebelum dan sesudah" onChange={(e) => setSplit(Number(e.target.value))}
              className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm">
          <button type="button" onClick={() => set("rotate", (s.rotate + 90) % 360)} className={chip(false)}><Icon name="rotate_right" className="mr-1 align-middle text-[18px]" />Putar 90°</button>
          <button type="button" aria-pressed={s.flipH} onClick={() => set("flipH", !s.flipH)} className={chip(s.flipH)}><Icon name="flip" className="mr-1 align-middle text-[18px]" />Flip</button>
          <button type="button" onClick={() => setS(DEFAULT_EDIT)} className={chip(false)}><Icon name="restart_alt" className="mr-1 align-middle text-[18px]" />Reset</button>
        </div>
      </section>

      <aside className="flex flex-col gap-space-md lg:col-span-4">
        <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-sm">
          <span className="font-headline-md text-headline-md text-on-surface">Penyesuaian</span>
          <Slider label="Exposure (EV)" value={s.exposure} min={-2} max={2} step={0.05} onChange={(v) => set("exposure", v)} format={(v) => (v > 0 ? "+" : "") + v.toFixed(2)} />
          <Slider label="Brightness" value={s.brightness} min={50} max={150} onChange={(v) => set("brightness", v)} format={(v) => `${v}%`} />
          <Slider label="Contrast" value={s.contrast} min={50} max={150} onChange={(v) => set("contrast", v)} format={(v) => `${v}%`} />
          <Slider label="Saturasi" value={s.saturation} min={0} max={200} onChange={(v) => set("saturation", v)} format={(v) => `${v}%`} />
          <Slider label="Blur (Gaussian σ)" value={s.blur} min={0} max={4} step={0.1} onChange={(v) => set("blur", v)} format={(v) => v.toFixed(1)} />
          <Slider label="Sharpen (unsharp mask)" value={s.sharpen} min={0} max={3} step={0.1} onChange={(v) => set("sharpen", v)} format={(v) => v.toFixed(1)} />
          <button type="button" aria-pressed={s.equalize} onClick={() => set("equalize", !s.equalize)} className={chip(s.equalize)}>Histogram equalization</button>
        </div>

        <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm">
          <span className="font-headline-md text-headline-md text-on-surface">Mode warna</span>
          <div className="flex flex-wrap gap-space-xs">
            {MODES.map((m) => <button key={m.id} type="button" aria-pressed={s.mode === m.id} onClick={() => set("mode", m.id)} className={chip(s.mode === m.id)}>{m.label}</button>)}
          </div>
          {s.mode === "binary" && (
            <>
              <Slider label="Threshold T" value={s.threshold} min={0} max={255} onChange={(v) => set("threshold", v)} />
              <button type="button" onClick={otsuNow} className={chip(false)}>Hitung T otomatis (Otsu)</button>
            </>
          )}
        </div>

        <div className="flex flex-col gap-space-sm">
          <button type="button" onClick={download} className="flex items-center justify-center gap-2 rounded-xl bg-primary-container p-3 font-label-lg text-label-lg font-bold text-on-primary-container shadow-[0_0_20px_-2px_rgba(77,142,255,0.4)] hover:bg-primary-container/90">
            <Icon name="download" className="text-[20px]" /> Unduh PNG (resolusi penuh)
          </button>
          <button type="button" onClick={saveToGallery} className="flex items-center justify-center gap-2 rounded-xl bg-surface-container-high p-3 font-label-lg text-label-lg text-on-surface hover:bg-surface-container-highest">
            <Icon name="photo_library" className="text-[20px] text-tertiary" /> Simpan ke Gallery
          </button>
          <p role="status" aria-live="polite" className="min-h-5 font-body-sm text-body-sm text-tertiary">{notice}</p>
        </div>
      </aside>
    </div>
  );
}
