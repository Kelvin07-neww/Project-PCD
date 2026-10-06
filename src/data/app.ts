export const APP_NAME = "PixelBooth";
export const APP_TAGLINE = "PRECISION DIP SUITE";
export const APP_FULL_TITLE = "PixelBooth - Scientific DIP & AI Photobooth";
export const APP_VERSION_BADGE = "v2.4 DIP Lab";
export const APP_BUILD = "CV-DIP 2.4.0-STABLE";
export const APP_ORG = "PixelBooth Laboratory";

/** Chip status di header (tampil di layar 2xl). Placeholder statis. */
export const HEADER_STATUS = {
  camera: "Camera 1080p 60fps",
  engine: "DIP Engine: WebGL/Accel",
} as const;

export interface FooterBadge {
  icon: string;
  iconClassName: string;
  label: string;
}

export const FOOTER_BADGES: readonly FooterBadge[] = [
  { icon: "memory", iconClassName: "text-tertiary", label: "GPU Matrix Pipeline Ready" },
  { icon: "tune", iconClassName: "text-secondary", label: "Sub-pixel 32-bit Float" },
];
