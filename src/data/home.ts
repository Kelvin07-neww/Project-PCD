import { ROUTES } from "@/data/navItems";

/* ---------- Hero ---------- */

export const HERO_EYEBROW = {
  badge: "Hardware-Accelerated WebGL 2.0 DIP Suite",
  caption: "Live Biometrics & FFT Matrix",
} as const;

export interface CapabilityStat {
  icon: string;
  iconClassName: string;
  value: string;
  label: string;
}

export const CAPABILITY_STATS: readonly CapabilityStat[] = [
  { icon: "view_in_ar", iconClassName: "text-primary", value: "40+", label: "Real-Time Kernels" },
  { icon: "speed", iconClassName: "text-secondary", value: "< 1 ms", label: "Sub-ms 2D FFT" },
  {
    icon: "photo_size_select_actual",
    iconClassName: "text-tertiary",
    value: "Lossless 4K",
    label: "High-Fidelity Capture",
  },
  { icon: "lock", iconClassName: "text-emerald-400", value: "100% Client", label: "Zero-Server Privacy" },
];

/* ---------- Kurva dekoratif (SVG) ---------- */

export interface CurvePath {
  d: string;
  fill?: string;
  stroke: string;
  strokeWidth: number;
}

export const HERO_HISTOGRAM_PATHS: readonly CurvePath[] = [
  {
    d: "M0 38 Q 20 30, 40 35 T 80 15 T 120 28 T 160 8 L 180 38 Z",
    fill: "rgba(255, 99, 132, 0.25)",
    stroke: "rgba(255, 99, 132, 0.7)",
    strokeWidth: 1,
  },
  {
    d: "M0 38 Q 30 25, 60 18 T 100 22 T 140 12 T 180 32 L 180 38 Z",
    fill: "rgba(75, 192, 192, 0.25)",
    stroke: "rgba(75, 192, 192, 0.7)",
    strokeWidth: 1,
  },
  {
    d: "M0 38 Q 25 35, 55 12 T 95 29 T 135 18 T 170 5 L 180 38 Z",
    fill: "rgba(54, 162, 235, 0.3)",
    stroke: "rgba(54, 162, 235, 0.8)",
    strokeWidth: 1.2,
  },
];

export const PILLAR_WAVEFORM_PATHS: readonly CurvePath[] = [
  { d: "M0 50 Q 30 10, 60 40 T 120 15 T 180 35 T 240 5", stroke: "#ff6384", strokeWidth: 1.5 },
  { d: "M0 55 Q 40 30, 80 15 T 160 30 T 240 20", stroke: "#4bc0c0", strokeWidth: 1.5 },
  { d: "M0 45 Q 50 15, 100 35 T 180 10 T 240 40", stroke: "#7bd0ff", strokeWidth: 1.5 },
];

export interface EdgePath {
  d: string;
  stroke: string;
  strokeWidth: number;
  dashed?: boolean;
}

export const CANNY_PREVIEW_PATHS: readonly EdgePath[] = [
  {
    d: "M20 55 C 35 40, 45 25, 60 20 C 75 16, 95 18, 110 32 C 120 42, 135 48, 150 50",
    stroke: "currentColor",
    strokeWidth: 1.2,
    dashed: true,
  },
  { d: "M50 35 C 55 30, 65 30, 70 34", stroke: "#adc6ff", strokeWidth: 1.5 },
  { d: "M90 34 C 95 30, 105 30, 110 35", stroke: "#adc6ff", strokeWidth: 1.5 },
  { d: "M80 40 L 78 48 L 84 48", stroke: "currentColor", strokeWidth: 1.2 },
  { d: "M68 54 Q 80 60 92 54", stroke: "#d0bcff", strokeWidth: 1.5 },
];

/* ---------- Pillars ---------- */

export type Tone = "primary" | "secondary" | "tertiary";

/** Semua class ditulis utuh agar terdeteksi Tailwind. */
export const TONE_CLASSES: Record<
  Tone,
  { text: string; iconBox: string; categoryText: string; link: string }
> = {
  primary: {
    text: "text-primary",
    iconBox: "bg-primary-container/20 text-primary",
    categoryText: "text-primary",
    link: "text-primary hover:text-primary-fixed",
  },
  secondary: {
    text: "text-secondary",
    iconBox: "bg-secondary-container/30 text-secondary",
    categoryText: "text-secondary",
    link: "text-secondary hover:text-secondary-fixed",
  },
  tertiary: {
    text: "text-tertiary",
    iconBox: "bg-tertiary-container/20 text-tertiary",
    categoryText: "text-tertiary",
    link: "text-tertiary hover:text-tertiary-fixed",
  },
};

export interface FilterChipData {
  label: string;
  dotClassName: string;
}

export const CREATIVE_FILTER_CHIPS: readonly FilterChipData[] = [
  { label: "Cinematic Teal & Orange", dotClassName: "bg-amber-400" },
  { label: "Vintage Emulsion 35mm", dotClassName: "bg-rose-400" },
  { label: "8-Level Posterize", dotClassName: "bg-primary" },
  { label: "Sepia Duotone", dotClassName: "bg-yellow-600" },
];

export const CREATIVE_SWATCHES: readonly string[] = [
  "bg-gradient-to-tr from-amber-500 to-orange-400",
  "bg-gradient-to-tr from-teal-500 to-cyan-400",
  "bg-gradient-to-tr from-purple-500 to-pink-500",
  "bg-gradient-to-tr from-emerald-500 to-teal-400",
];

export const WAVEFORM_READOUTS = [
  { label: "R", value: "0.84", className: "" },
  { label: "G", value: "0.62", className: "" },
  { label: "B", value: "0.91", className: "" },
  { label: "Y", value: "0.74", className: "text-tertiary" },
] as const;

export interface PillarMeta {
  id: string;
  tone: Tone;
  icon: string;
  category: string;
  title: string;
  description: string;
  footerNote?: string;
  linkTo: string;
  linkLabel: string;
}

export const PILLARS: readonly PillarMeta[] = [
  {
    id: "creative",
    tone: "primary",
    icon: "auto_fix_high",
    category: "CREATIVE LAB",
    title: "Creative & Artistic Filters",
    description:
      "Apply beautiful effects, warm cinematic grading, vintage emulsions, and instant transformations engineered with non-destructive lookup tables.",
    linkTo: ROUTES.photoBooth,
    linkLabel: "Launch Booth",
  },
  {
    id: "analysis",
    tone: "tertiary",
    icon: "insights",
    category: "ANALYTIC DIP",
    title: "Digital Image Processing Analysis",
    description:
      "Analyze spatial resolution, dynamic histograms, independent RGB color channels, and adaptive Otsu thresholding in millisecond precision.",
    footerNote: "CDF Equalization • Quantization",
    linkTo: ROUTES.imageAnalysis,
    linkLabel: "Inspect Metrics",
  },
  {
    id: "fourier",
    tone: "secondary",
    icon: "graphic_eq",
    category: "SPECTRAL MATRIX",
    title: "2D Fourier Frequency Domain",
    description:
      "Deconstruct photos into spatial frequencies, isolate low vs high pass components with ideal and Butterworth filters, and reconstruct via Inverse FFT.",
    footerNote: "IFFT Reconstruct • Phase/Mag",
    linkTo: ROUTES.fourierSpectrum,
    linkLabel: "View Spectrum",
  },
];

/* ---------- Pipeline footer links ---------- */

export const PIPELINE_TECHNIQUES = [
  { label: "Fast Fourier Transform (Cooley-Tukey)", to: ROUTES.fourierSpectrum, hover: "hover:text-primary" },
  { label: "Otsu Binarization", to: ROUTES.imageAnalysis, hover: "hover:text-tertiary" },
  { label: "Laplacian of Gaussian (LoG)", to: ROUTES.imageAnalysis, hover: "hover:text-secondary" },
] as const;
