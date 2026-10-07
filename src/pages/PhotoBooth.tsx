import { addPhoto } from "@/lib/gallery";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { ThirdsGrid } from "@/components/ui/ThirdsGrid";
import { ROUTES } from "@/data/navItems";
import { useCamera, type Facing } from "@/hooks/useCamera";
import { cx } from "@/lib/cx";
import {
  DEFAULT_CALIBRATION, DEFAULT_PARAMS, applyFilter, calibrate, histogram, toGray,
  type Calibration, type FilterId, type FilterParams,
} from "@/lib/dip";

const FILTERS: { id: FilterId; label: string; note: string }[] = [
  { id: "none", label: "Original", note: "Tanpa filter" },
  { id: "grayscale", label: "Grayscale", note: "Luminance B/W" },
  { id: "sepia", label: "Sepia", note: "Tone klasik hangat" },
  { id: "warm", label: "Warm", note: "Color grade hangat" },
  { id: "cool", label: "Cool", note: "Color grade dingin" },
  { id: "invert", label: "Invert", note: "Negatif RGB" },
  { id: "posterize", label: "Posterize", note: "5 level warna" },
  { id: "pixelate", label: "Pixelate", note: "Blok 8×8" },
  { id: "blur", label: "Gaussian Blur", note: "Blur luminance" },
  { id: "sharpen", label: "Sharpen", note: "Detail 3×3" },
  { id: "emboss", label: "Emboss", note: "Relief tekstur" },
  { id: "threshold", label: "Threshold", note: "Biner T=128" },
  { id: "canny", label: "Canny Edge", note: "Gradient 2-tahap" },
  { id: "sobel", label: "Sobel 3×3", note: "Turunan dx/dy" },
  { id: "prewitt", label: "Prewitt", note: "Vektor selisih" },
  { id: "otsu", label: "Otsu Binarize", note: "Ambang otomatis" },
];

const TIMERS = [0, 3, 5, 10];
const PREVIEW_WIDTH = 320;
const MAX_SHOTS = 8;
const MAX_RECORDINGS = 4;
const LAST_CAPTURE_KEY = "pixelbooth:last-capture";
const LAST_CAPTURE_ID_KEY = "pixelbooth:last-capture-id";

interface Settings { filter: FilterId; calib: Calibration; params: FilterParams; mirror: boolean }
interface Shot { id: number; url: string; filter: FilterId }
interface VideoFrameSnapshot { id: number; url: string; label: string }
interface Recording { id: number; url: string; frameUrl: string; frames: VideoFrameSnapshot[]; filter: FilterId }
type PreviewItem =
  | { type: "photo"; id: number; url: string; filter: FilterId }
  | { type: "video"; id: number; url: string; frameUrl: string; frames: VideoFrameSnapshot[]; filter: FilterId };

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
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [preview, setPreview] = useState<PreviewItem | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [recordingNotice, setRecordingNotice] = useState<string | null>(null);
  const [stats, setStats] = useState({ fps: 0, ms: 0, info: "", w: 0, h: 0 });
  const [hist, setHist] = useState<number[]>([]);
  const [uploadReady, setUploadReady] = useState(false);

  const { videoRef, ready, error } = useCamera(mode === "camera", facing);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingFrameTimerRef = useRef<number | null>(null);
  const recordingFramesRef = useRef<VideoFrameSnapshot[]>([]);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordingsRef = useRef<Recording[]>([]);
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

  const noSource = mode === "camera" ? !ready : !uploadReady;

  const capture = useCallback(() => {
    const src = getSource();
    if (!src) return;
    const off = document.createElement("canvas");
    if (!process(src, off, Infinity, settings.current)) return;
    const url = off.toDataURL("image/jpeg", 0.92);
    const shot = { id: Date.now(), url, filter: settings.current.filter };
    setShots((list) => [shot, ...list].slice(0, MAX_SHOTS));
    setPreview({ type: "photo", ...shot });
    try {
      localStorage.setItem(LAST_CAPTURE_KEY, url);
      localStorage.setItem(LAST_CAPTURE_ID_KEY, String(shot.id));
    } catch {}
    void addPhoto({ id: shot.id, url, filter: settings.current.filter, createdAt: shot.id }).catch(() => undefined); setFlash(true);
    window.setTimeout(() => setFlash(false), 180);
  }, [getSource]);

  useEffect(() => {
    if (count === null) return;
    if (count === 0) { setCount(null); capture(); return; }
    const id = window.setTimeout(() => setCount((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [count, capture]);

  const onShutter = () => (count !== null ? setCount(null) : timer === 0 ? capture() : setCount(timer));

  const stopRecording = useCallback(() => {
    if (recordingFrameTimerRef.current !== null) {
      window.clearInterval(recordingFrameTimerRef.current);
      recordingFrameTimerRef.current = null;
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const captureVideoFrame = useCallback((label: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/jpeg", 0.92);
    const frame = { id: Date.now() + recordingFramesRef.current.length, url, label };
    recordingFramesRef.current = [...recordingFramesRef.current, frame].slice(-8);
  }, []);

  const startRecording = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || noSource || typeof MediaRecorder === "undefined") return;

    const canvasStream = canvas.captureStream(15);
    const stream = new MediaStream(canvasStream.getVideoTracks());
    let audioStream: MediaStream;

    try {
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      audioStream.getAudioTracks().forEach((track) => stream.addTrack(track));
      setRecordingAudio(audioStream.getAudioTracks().length > 0);
      setRecordingNotice(null);
    } catch {
      canvasStream.getTracks().forEach((track) => track.stop());
      setRecordingAudio(false);
      setRecordingNotice("Mikrofon belum aktif. Izinkan akses mic agar video punya suara.");
      return;
    }

    const mimeType = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=opus",
      "video/webm",
    ].find((type) => MediaRecorder.isTypeSupported(type)) ?? "";

    chunksRef.current = [];
    recordingFramesRef.current = [];
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    recorderRef.current = recorder;
    recordingStreamRef.current = stream;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      chunksRef.current = [];
      recorderRef.current = null;
      setRecording(false);
      setRecordingAudio(false);
      if (!blob.size) return;
      const url = URL.createObjectURL(blob);
      const id = Date.now();
      captureVideoFrame("Frame akhir");
      const frames = recordingFramesRef.current.length
        ? recordingFramesRef.current
        : canvasRef.current
          ? [{ id, url: canvasRef.current.toDataURL("image/jpeg", 0.92), label: "Frame akhir" }]
          : [];
      const frameUrl = frames[frames.length - 1]?.url ?? "";
      const item = { id, url, frameUrl, frames, filter: settings.current.filter };
      setRecordings((list) => {
        const next = [item, ...list].slice(0, MAX_RECORDINGS);
        list.slice(MAX_RECORDINGS - 1).forEach((item) => URL.revokeObjectURL(item.url));
        return next;
      });
      if (frames.length) {
        try {
          localStorage.setItem(LAST_CAPTURE_KEY, frameUrl);
          localStorage.setItem(LAST_CAPTURE_ID_KEY, String(id));
        } catch {}
        frames.forEach((frame, index) => {
          void addPhoto({
            id: frame.id,
            url: frame.url,
            filter: `${settings.current.filter}-video-frame`,
            createdAt: id + index,
          }).catch(() => undefined);
        });
      }
      setPreview({ type: "video", ...item });
    };

    recorder.start(250);
    captureVideoFrame("Frame awal");
    recordingFrameTimerRef.current = window.setInterval(() => {
      captureVideoFrame(`Frame ${recordingFramesRef.current.length + 1}`);
    }, 1500);
    setRecording(true);
  }, [captureVideoFrame, noSource]);

  const onRecord = () => (recording ? stopRecording() : void startRecording());

  useEffect(() => {
    recordingsRef.current = recordings;
  }, [recordings]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
      if (recordingFrameTimerRef.current !== null) window.clearInterval(recordingFrameTimerRef.current);
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  const onUpload = (file?: File) => {
    if (!file) return;
    const img = new Image();
    img.onload = () => { imgRef.current = img; setUploadReady(true); setMode("upload"); };
    img.src = URL.createObjectURL(file);
  };

  const path = hist.length ? hist.map((v, i) => `${i},${30 - (v / Math.max(...hist, 1)) * 30}`).join(" ") : "";

  return (
    <>
    <div className="grid w-full flex-1 grid-cols-1 items-start gap-gutter px-gutter-mobile py-space-md md:px-gutter lg:grid-cols-12">
      <video ref={videoRef} playsInline muted className="hidden" />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
      {recordingNotice && (
        <div role="status" className="fixed left-1/2 top-20 z-[80] max-w-sm -translate-x-1/2 rounded-xl bg-error-container px-space-md py-space-sm text-center font-body-sm text-body-sm text-on-error-container shadow-xl">
          {recordingNotice}
        </div>
      )}

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
              {recording && (
                <div role="status" className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-full bg-error-container/90 px-space-md py-1.5 font-metric-mono-sm text-metric-mono-sm font-bold text-on-error-container shadow-lg backdrop-blur-md">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-error motion-reduce:animate-none" /> REC {recordingAudio ? "• MIC" : ""}
                </div>
              )}
            </>
          )}
          {count !== null && (
            <div role="status" aria-live="assertive" className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/50 font-headline-xl text-[96px] text-on-surface">{count}</div>
          )}
          <div aria-hidden="true" className={cx("pointer-events-none absolute inset-0 bg-white transition-opacity duration-150", flash ? "opacity-80" : "opacity-0")} />
        </div>

        <div className="z-20 -mt-6 flex w-full max-w-xl items-center justify-around gap-space-md rounded-2xl bg-surface-container-low/90 p-space-sm shadow-xl backdrop-blur-xl">
          <button type="button" title="Balik kamera" aria-label="Balik kamera" disabled={mode !== "camera"} onClick={() => setFacing(facing === "user" ? "environment" : "user")} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-highest text-on-surface transition-all hover:text-primary disabled:opacity-40">
            <Icon name="cameraswitch" className="text-[20px]" />
          </button>
          <button type="button" title={recording ? "Stop rekam" : "Rekam video"} aria-label={recording ? "Stop rekam" : "Rekam video"} disabled={noSource} onClick={onRecord} className={cx("flex h-11 w-11 items-center justify-center rounded-full transition-all disabled:opacity-40", recording ? "bg-error text-on-error shadow-[0_0_20px_rgba(255,180,171,0.45)]" : "bg-surface-container-highest text-on-surface hover:text-error")}>
            <Icon name={recording ? "stop" : "fiber_manual_record"} className="text-[22px]" />
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
                <button type="button" onClick={() => setPreview({ type: "photo", ...s })} className="block rounded-lg outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary/70">
                  <img src={s.url} alt={`Capture filter ${s.filter}`} className="h-16 w-24 rounded-lg object-cover" />
                </button>
                <a href={s.url} download={`pixelbooth-${s.id}.jpg`} aria-label="Unduh foto" className="absolute bottom-1 right-1 rounded bg-surface-container-lowest/85 p-0.5 text-primary">
                  <Icon name="download" className="text-[16px]" />
                </a>
              </li>
            ))}
          </ul>
        )}

        {recordings.length > 0 && (
          <ul className="flex w-full gap-space-sm overflow-x-auto pt-space-sm" aria-label="Hasil rekaman">
            {recordings.map((item) => (
              <li key={item.id} className="relative shrink-0 overflow-hidden rounded-lg bg-surface-container-lowest">
                <button type="button" onClick={() => setPreview({ type: "video", ...item })} className="block rounded-lg outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary/70">
                  <video src={item.url} muted className="h-24 w-36 object-cover" />
                </button>
                <a href={item.url} download={`pixelbooth-recording-${item.id}.webm`} aria-label="Unduh rekaman" className="absolute bottom-1 right-1 rounded bg-surface-container-lowest/85 p-0.5 text-primary">
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
    {preview && (
      <div role="dialog" aria-modal="true" aria-label="Preview hasil Photo Booth" className="fixed inset-0 z-[70] flex items-center justify-center bg-surface-container-lowest/80 p-margin-mobile backdrop-blur-xl sm:p-margin">
        <div className="preview-pop flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-low shadow-2xl">
          <div className="flex items-center justify-between gap-space-md border-b border-outline-variant/30 px-space-md py-space-sm">
            <div>
              <p className="font-metric-mono-sm text-metric-mono-sm uppercase tracking-wider text-tertiary">
                {preview.type === "photo" ? "Preview Foto" : "Preview Video"}
              </p>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Filter: {preview.filter}
              </h2>
            </div>
            <button type="button" onClick={() => setPreview(null)} aria-label="Tutup preview" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-on-surface transition-colors hover:text-primary">
              <Icon name="close" className="text-[22px]" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center bg-surface-container-lowest p-space-md">
            {preview.type === "photo" ? (
              <img src={preview.url} alt={`Preview foto filter ${preview.filter}`} className="max-h-[68vh] w-auto max-w-full rounded-xl object-contain shadow-xl" />
            ) : (
              <video src={preview.url} controls autoPlay loop playsInline className="max-h-[68vh] w-auto max-w-full rounded-xl object-contain shadow-xl" />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-space-sm border-t border-outline-variant/30 px-space-md py-space-sm">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {preview.type === "photo" ? "Foto berhasil diambil." : "Video berhasil direkam."}
            </span>
            <div className="flex items-center gap-space-sm">
              <button type="button" onClick={() => setPreview(null)} className="rounded-full bg-surface-container-highest px-space-md py-2 font-label-lg text-label-lg text-on-surface transition-colors hover:text-primary">
                Ambil lagi
              </button>
              {(preview.type === "photo" || (preview.type === "video" && preview.frameUrl)) && (
                <>
                  <Link to={`${ROUTES.resultEdit}?id=${preview.type === "video" ? preview.frames[preview.frames.length - 1]?.id ?? preview.id : preview.id}`} className="inline-flex items-center gap-1 rounded-full bg-surface-container-highest px-space-md py-2 font-label-lg text-label-lg text-on-surface transition-colors hover:text-primary">
                    <Icon name="tune" className="text-[18px]" /> {preview.type === "video" ? "Edit Frame" : "Edit"}
                  </Link>
                  <Link to={`${ROUTES.imageAnalysis}?id=${preview.type === "video" ? preview.frames[preview.frames.length - 1]?.id ?? preview.id : preview.id}`} className="inline-flex items-center gap-1 rounded-full bg-surface-container-highest px-space-md py-2 font-label-lg text-label-lg text-on-surface transition-colors hover:text-tertiary">
                    <Icon name="insights" className="text-[18px]" /> {preview.type === "video" ? "Analisis Frame" : "Analisis"}
                  </Link>
                  <Link to={`${ROUTES.fourierSpectrum}?id=${preview.type === "video" ? preview.frames[preview.frames.length - 1]?.id ?? preview.id : preview.id}`} className="inline-flex items-center gap-1 rounded-full bg-surface-container-highest px-space-md py-2 font-label-lg text-label-lg text-on-surface transition-colors hover:text-secondary">
                    <Icon name="graphic_eq" className="text-[18px]" /> {preview.type === "video" ? "Fourier Frame" : "Fourier"}
                  </Link>
                  <Link to={ROUTES.gallery} className="inline-flex items-center gap-1 rounded-full bg-surface-container-highest px-space-md py-2 font-label-lg text-label-lg text-on-surface transition-colors hover:text-primary">
                    <Icon name="photo_library" className="text-[18px]" /> Gallery
                  </Link>
                </>
              )}
              <a href={preview.url} download={preview.type === "photo" ? `pixelbooth-${preview.id}.jpg` : `pixelbooth-recording-${preview.id}.webm`} className="inline-flex items-center gap-1 rounded-full bg-primary-container px-space-md py-2 font-label-lg text-label-lg text-on-primary-container transition-opacity hover:opacity-90">
                <Icon name="download" className="text-[18px]" /> Download
              </a>
            </div>
          </div>

          {preview.type === "video" && preview.frames.length > 0 && (
            <div className="border-t border-outline-variant/30 bg-surface-container px-space-md py-space-sm">
              <p className="mb-space-xs font-metric-mono-sm text-metric-mono-sm uppercase tracking-wider text-on-surface-variant">
                Keyframe video untuk pengolahan citra
              </p>
              <div className="flex gap-space-sm overflow-x-auto">
                {preview.frames.map((frame) => (
                  <div key={frame.id} className="flex shrink-0 flex-col gap-1 rounded-lg bg-surface-container-lowest p-1.5">
                    <img src={frame.url} alt={frame.label} className="h-16 w-24 rounded object-cover" />
                    <span className="font-metric-mono-sm text-[10px] text-on-surface-variant">{frame.label}</span>
                    <div className="flex gap-1">
                      <Link to={`${ROUTES.imageAnalysis}?id=${frame.id}`} className="rounded bg-surface-container-high px-1.5 py-0.5 font-metric-mono-sm text-[10px] text-tertiary">Analisis</Link>
                      <Link to={`${ROUTES.fourierSpectrum}?id=${frame.id}`} className="rounded bg-surface-container-high px-1.5 py-0.5 font-metric-mono-sm text-[10px] text-secondary">FFT</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}
