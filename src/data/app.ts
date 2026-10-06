export const APP_NAME = "PixelBooth";
export const APP_TAGLINE = "SUITE DIP PRESISI";
export const APP_FULL_TITLE = "PixelBooth - DIP Ilmiah & Photobooth AI";
export const APP_VERSION_BADGE = "v2.4 Lab DIP";
export const APP_BUILD = "CV-DIP 2.4.0-STABLE";
export const APP_ORG = "Laboratorium PixelBooth";

/** Chip status di header (tampil di layar 2xl). Placeholder statis. */
export const HEADER_STATUS = {
  camera: "Kamera 1080p 60fps",
  engine: "Mesin DIP: WebGL/Akselerasi",
} as const;

export interface FooterBadge {
  icon: string;
  iconClassName: string;
  label: string;
}

export const FOOTER_BADGES: readonly FooterBadge[] = [
  { icon: "memory", iconClassName: "text-tertiary", label: "Pipeline Matriks GPU Siap" },
  { icon: "tune", iconClassName: "text-secondary", label: "Sub-piksel Float 32-bit" },
];
