import { addPhoto } from "@/lib/gallery";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ThirdsGrid } from "@/components/ui/ThirdsGrid";
import { useCamera, type Facing } from "@/hooks/useCamera";
import { cx } from "@/lib/cx";
import {
  DEFAULT_CALIBRATION, DEFAULT_PARAMS, applyFilter, calibrate, histogram, toGray,
  type Calibration, type FilterId, type FilterParams,
} from "@/lib/dip";

const FILTERS: { id: FilterId; label: string; note: string }[] = [
  { id: "none", label: "Original", note: "Tanpa filter" },
  { id: "canny", label: "Canny Edge", note: "Gradient 2-tahap" },
  { id: "sobel", label: "Sobel 3×3", note: "Turunan dx/dy" },
  { id: "prewitt", label: "Prewitt", note: "Vektor selisih" },
  { id: "otsu", label: "Otsu Binarize", note: "Ambang otomatis" },
];

const TIMERS = [0, 3, 5, 10];
const PREVIEW_WIDTH = 320;
const MAX_SHOTS = 8;

interface Settings { filter: FilterId; calib: Calibration; params: FilterParams; mirror: boolean }
interface Shot { id: number; url: string; filter: FilterId }

function process(src: CanvasImageSource & { videoWidth?: number; naturalWidth?: number }, canvas: HTMLCanvasElement, maxW: number, s: Settings) {
  const sw = src.videoWidth || src.naturalWidth || 0;
  const sh = (src as HTMLVideoElement).videoHeight || (src as HTMLImageElement).naturalHeight || 0;
  if (!sw || !sh) return null;
  const scale = Math.min(1, maxW / sw);
  const w = Math.round(sw * scale), h = Math.round(sh * scale);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.save();
  if (s.mirror) { ctx.translate(w, 0); ctx.scale(-1, 1); }
  ctx.drawImage(src, 0, 0, w, h);
  ctx.restore();
  const img = ctx.getImageData(0, 0, w, h);
  calibrate(img, s.calib);
  const luma = toGray(img);
  const info = applyFilter(img, s.filter, s.params);
  ctx.putImageData(img, 0, 0);
  return { info, hist: histogram(luma) };
}

function Slider({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center justify-between font-metric-mono-sm text-metric-mono-sm">
        <span className="uppercase text-on-surface-variant">{label}</span>
        <span className="font-bold text-primary">{format ? format(value) : value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-primary" />
    </label>
  );
}

const panel = "flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-sm";
const heading = "font-label-md text-label-md uppercase tracking-wider text-on-surface-variant";

export default function PhotoBooth() {
  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [facing, setFacing] = useState<Facing>("user");
  const [filter, setFilter] = useState<FilterId>("canny");
  const [calib, setCalib] = useState<Calibration>(DEFAULT_CALIBRATION);
  const [params] = useState<FilterParams>(DEFAULT_PARAMS);
  const [mirror, setMirror] = useState(true);
  const [grid, setGrid] = useState(true);
  const [timer, setTimer] = useState(3);
  const [count, setCount] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [stats, setStats] = useState({ fps: 0, ms: 0, info: "", w: 0, h: 0 });
  const [hist, setHist] = useState<number[]>([]);
  const [uploadReady, setUploadReady] = useState(false);

  const { videoRef, ready, error } = useCamera(mode === "camera", facing);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const settings = useRef<Settings>({ filter, calib, params, mirror });
  settings.current = { filter, calib, params, mirror: mode === "camera" && mirror };

  const getSource = useCallback(() => {
    if (mode === "upload") return uploadReady ? imgRef.current : null;
    const v = videoRef.current;
    return v && v.readyState >= 2 ? v : null;
  }, [mode, uploadReady, videoRef]);

  useEffect(() => {
    let raf = 0, last = 0, frames = 0, mark = performance.now(), lastKey = "";
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 66) return;
      last = t;
      const src = getSource(), canvas = canvasRef.current;
      if (!src || !canvas) return;
      const still = src === imgRef.current;
      if (still) {
        const key = (src as HTMLImageElement).src + JSON.stringify(settings.current);
        if (key === lastKey) return;
        lastKey = key;
      }
      const t0 = performance.now();
      const r = process(src, canvas, PREVIEW_WIDTH, settings.current);
      if (!r) return;
      frames++;
      const now = performance.now();
      if (still || now - mark >= 500) {
        setStats({ fps: Math.round((frames * 1000) / (now - mark)), ms: Math.round(now - t0), info: r.info, w: canvas.width, h: canvas.height });
        setHist(r.hist);
        frames = 0; mark = now;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [getSource]);

  const capture = useCallback(() => {
    const src = getSource();
    if (!src) return;
    const off = document.createElement("canvas");
    if (!process(src, off, Infinity, settings.current)) return;
    const url = off.toDataURL("image/jpeg", 0.92);
    setShots((list) => [{ id: Date.now(), url, filter: settings.current.filter }, ...list].slice(0, MAX_SHOTS));
    try { localStorage.setItem("pixelbooth:last-capture", url); } catch {}
    void addPhoto({ id: Date.now(), url, filter: settings.current.filter, createdAt: Date.now() }).catch(() => undefined); setFlash(true);
    window.setTimeout(() => setFlash(false), 180);
  }, [getSource]);

  useEffect(() => {
    if (count === null) return;
    if (count === 0) { setCount(null); capture(); return; }
    const id = window.setTimeout(() => setCount((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [count, capture]);

  const onShutter = () => (count !== null ? setCount(null) : timer === 0 ? capture() : setCount(timer));

  const onUpload = (file?: File) => {
    if (!file) return;
    const img = new Image();
    img.onload = () => { imgRef.current = img; setUploadReady(true); setMode("upload"); };
    img.src = URL.createObjectURL(file);
  };

  const noSource = mode === "camera" ? !ready : !uploadReady;
  const path = hist.length ? hist.map((v, i) => `${i},${30 - (v / Math.max(...hist, 1)) * 30}`).join(" ") : "";

  return (
    <div className="grid w-full flex-1 grid-cols-1 items-start gap-gutter px-gutter-mobile py-space-md md:px-gutter lg:grid-cols-12">
      <video ref={videoRef} playsInline muted className="hidden" />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />

      <aside className="flex flex-col gap-space-md lg:col-span-3">
        <div className={panel}>
          <span className={heading}>Sumber gambar</span>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-container-lowest p-1">
            {(["camera", "upload"] as const).map((m) => (
              <button key={m} type="button" onClick={() => (m === "upload" && !uploadReady ? fileRef.current?.click() : setMode(m))}
                className={cx("rounded px-2 py-1 font-label-md text-label-md transition-all",
                  mode === m ? "bg-primary-container font-semibold text-on-primary-container" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface")}>
                {m === "camera" ? "Kamera" : "Upload"}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-lg bg-surface-container-lowest p-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-high">
            <Icon name="drive_folder_upload" className="text-[18px] text-primary" /> Pilih foto dari komputer
          </button>
        </div>

        <div className={panel}>
          <div className="flex items-center justify-between">
            <span className="font-headline-md text-headline-md text-on-surface">Kalibrasi optik</span>
            <button type="button" className="font-label-md text-label-md text-primary hover:underline" onClick={() => setCalib(DEFAULT_CALIBRATION)}>Reset</button>
          </div>
          <Slider label="Exposure (EV)" value={calib.exposure} min={-2} max={2} step={0.05} onChange={(v) => setCalib({ ...calib, exposure: v })} format={(v) => (v > 0 ? "+" : "") + v.toFixed(2)} />
          <Slider label="Brightness" value={calib.brightness} min={50} max={150} step={1} onChange={(v) => setCalib({ ...calib, brightness: v })} format={(v) => `${v}%`} />
          <Slider label="Contrast" value={calib.contrast} min={50} max={150} step={1} onChange={(v) => setCalib({ ...calib, contrast: v })} format={(v) => `${v}%`} />
        </div>

        <div className={panel}>
          <span className={heading}>Komposisi & timer</span>
          <div className="flex items-center justify-between font-label-md text-label-md text-on-surface">
            <button type="button" aria-pressed={grid} onClick={() => setGrid(!grid)} className={cx("flex items-center gap-1 rounded-lg px-2 py-1.5", grid ? "bg-surface-container-highest text-primary" : "bg-surface-container-lowest text-on-surface-variant")}>
              <Icon name="grid_3x3" className="text-[18px]" /> Grid 3×3
            </button>
            <button type="button" aria-pressed={mirror} onClick={() => setMirror(!mirror)} className={cx("flex items-center gap-1 rounded-lg px-2 py-1.5", mirror ? "bg-surface-container-highest text-primary" : "bg-surface-container-lowest text-on-surface-variant")}>
              <Icon name="flip" className="text-[18px]" /> Mirror
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface">Self-timer</span>
            <div className="flex gap-1">
              {TIMERS.map((t) => (
                <button key={t} type="button" onClick={() => setTimer(t)} className={cx("rounded px-2 py-0.5 font-metric-mono-sm text-metric-mono-sm", timer === t ? "bg-primary-container font-bold text-on-primary-container" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface")}>{t}s</button>
              ))}
            </div>
          </div>
        </div>

        <div className={cx(panel, "gap-space-xs")}>
          <div className="flex justify-between font-label-md text-label-md"><span className="uppercase text-on-surface-variant">Luma histogram</span><span className="font-metric-mono-sm text-metric-mono-sm text-tertiary">256 bins</span></div>
          <svg aria-hidden="true" className="h-12 w-full text-primary" preserveAspectRatio="none" viewBox="0 0 255 30">
            {path && <polyline points={`0,30 ${path} 255,30`} fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
          </svg>
        </div>
      </aside>

      <section className="flex flex-col items-center gap-space-sm lg:col-span-6">
        <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl bg-surface-container-lowest shadow-2xl sm:aspect-[16/10]">
          <canvas ref={canvasRef} className={cx("h-full w-full object-contain", noSource && "hidden")} />
          {noSource && (
            <div className="flex max-w-xs flex-col items-center gap-space-sm p-space-lg text-center">
              <Icon name={error ? "videocam_off" : "photo_camera"} className="text-[36px] text-primary" />
              <p className="font-body-md text-body-md text-on-surface-variant">
                {mode === "camera" ? error ?? "Menunggu izin kamera… klik Allow di browser." : "Pilih foto untuk diproses."}
              </p>
              {mode === "camera" && error && <button type="button" onClick={() => fileRef.current?.click()} className="rounded-full bg-primary-container px-space-lg py-2 font-label-lg text-label-lg text-on-primary-container">Upload foto saja</button>}
            </div>
          )}
          {!noSource && grid && <ThirdsGrid lineClassName="border-primary/40" className="opacity-25" />}
          {!noSource && (
            <>
              <div className="absolute left-4 top-4 rounded bg-surface-container-lowest/80 px-space-sm py-1 font-metric-mono-sm text-metric-mono-sm text-on-surface-variant backdrop-blur">
                <span className="text-tertiary">{mode === "camera" ? "LIVE ●" : "STILL"}</span> {stats.w}×{stats.h}
              </div>
              <div className="absolute right-4 top-4 flex items-center gap-space-xs rounded-full bg-surface-container-lowest/85 px-space-md py-1.5 font-metric-mono-sm text-metric-mono-sm text-on-surface shadow-md backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary motion-reduce:animate-none" /> {stats.info}
              </div>
              <div className="absolute bottom-4 left-4 rounded bg-surface-container-lowest/80 px-space-sm py-1 font-metric-mono-sm text-metric-mono-sm text-on-surface-variant backdrop-blur">
                {mode === "camera" ? stats.fps + " FPS" : "Statis"} · {stats.ms} ms/frame
              </div>
            </>
          )}
          {count !== null && (
            <div role="status" aria-live="assertive" className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/50 font-headline-xl text-[96px] text-on-surface">{count}</div>
          )}
          <div aria-hidden="true" className={cx("pointer-events-none absolute inset-0 bg-white transition-opacity duration-150", flash ? "opacity-80" : "opacity-0")} />
        </div>

        <div className="z-20 -mt-6 flex w-full max-w-lg items-center justify-around gap-space-md rounded-2xl bg-surface-container-low/90 p-space-sm shadow-xl backdrop-blur-xl">
          <button type="button" title="Balik kamera" aria-label="Balik kamera" disabled={mode !== "camera"} onClick={() => setFacing(facing === "user" ? "environment" : "user")} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-highest text-on-surface transition-all hover:text-primary disabled:opacity-40">
            <Icon name="cameraswitch" className="text-[20px]" />
          </button>
          <button type="button" aria-label={count !== null ? "Batalkan timer" : "Ambil foto"} disabled={noSource} onClick={onShutter} className="group flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-tertiary p-1 shadow-[0_0_28px_rgba(77,142,255,0.45)] transition-all hover:shadow-[0_0_36px_rgba(77,142,255,0.7)] active:scale-95 disabled:opacity-40">
            <span className="flex h-full w-full items-center justify-center rounded-full bg-surface-container-lowest p-1.5">
              <span className="flex h-full w-full items-center justify-center rounded-full bg-primary text-on-primary group-hover:bg-primary-container">
                <Icon name={count !== null ? "close" : "photo_camera"} className="text-[32px]" />
              </span>
            </span>
          </button>
          <button type="button" title="Ganti foto" aria-label="Upload foto" onClick={() => fileRef.current?.click()} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-highest text-on-surface transition-all hover:text-tertiary">
            <Icon name="drive_folder_upload" className="text-[20px]" />
          </button>
        </div>

        {shots.length > 0 && (
          <ul className="flex w-full gap-space-sm overflow-x-auto pt-space-sm" aria-label="Hasil capture">
            {shots.map((s) => (
              <li key={s.id} className="relative shrink-0">
                <img src={s.url} alt={`Capture filter ${s.filter}`} className="h-16 w-24 rounded-lg object-cover" />
                <a href={s.url} download={`pixelbooth-${s.id}.jpg`} aria-label="Unduh foto" className="absolute bottom-1 right-1 rounded bg-surface-container-lowest/85 p-0.5 text-primary">
                  <Icon name="download" className="text-[16px]" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="flex flex-col gap-space-md lg:col-span-3">
        <div className={cx(panel, "gap-space-sm p-space-sm")}>
          <div className="flex items-center justify-between px-space-xs">
            <span className="font-headline-md text-headline-md text-on-surface">Filter pipeline</span>
            <Icon name="view_in_ar" className="text-[18px] text-primary" />
          </div>
          <div className="grid grid-cols-2 gap-space-xs">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
                className={cx("flex flex-col gap-1 rounded-lg p-2 text-left transition-all",
                  filter === f.id ? "bg-surface-container-highest shadow-md" : "bg-surface-container-lowest hover:bg-surface-container")}>
                <span className="flex items-center justify-between font-metric-mono-sm text-metric-mono-sm">
                  <span className={filter === f.id ? "font-bold text-primary" : "text-on-surface"}>{f.label}</span>
                </span>
                <span className="font-body-xs text-body-xs text-on-surface-variant">{f.note}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}