import { useEffect, useRef } from "react";
import type { Pixels } from "@/lib/dip/core";

interface PixelCanvasProps {
  pixels: Pixels;
  /** Deskripsi untuk screen reader. */
  label: string;
  className?: string;
}

/** Menggambar buffer RGBA hasil engine DIP ke <canvas>. */
export function PixelCanvas({ pixels, label, className }: PixelCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = pixels.width;
    canvas.height = pixels.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const frame = ctx.createImageData(pixels.width, pixels.height);
    frame.data.set(pixels.data);
    ctx.putImageData(frame, 0, 0);
  }, [pixels]);

  return <canvas ref={ref} role="img" aria-label={label} className={className} />;
}
