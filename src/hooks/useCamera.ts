import { useEffect, useRef, useState } from "react";

export type Facing = "user" | "environment";

/** Membuka webcam ke <video>. Stream dimatikan otomatis saat enabled=false atau komponen unmount. */
export function useCamera(enabled: boolean, facing: Facing) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Browser ini tidak mendukung akses kamera (butuh HTTPS atau localhost).");
      return;
    }
    let cancelled = false;
    let stream: MediaStream | undefined;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        const v = videoRef.current;
        if (v) {
          v.srcObject = s;
          void v.play().catch(() => undefined);
        }
        setError(null);
        setReady(true);
      })
      .catch((e: unknown) => {
        const name = e instanceof DOMException ? e.name : "";
        setError(
          name === "NotAllowedError"
            ? "Izin kamera ditolak. Klik ikon gembok di address bar lalu pilih Allow."
            : name === "NotFoundError"
              ? "Kamera tidak ditemukan. Pakai mode Upload."
              : "Kamera gagal dibuka. Tutup aplikasi lain yang memakai kamera.",
        );
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      setReady(false);
    };
  }, [enabled, facing]);

  return { videoRef, ready, error };
}
