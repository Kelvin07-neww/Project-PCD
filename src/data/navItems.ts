export const ROUTES = {
  home: "/",
  photoBooth: "/photo-booth",
  resultEdit: "/result-and-edit",
  imageAnalysis: "/image-analysis",
  fourierSpectrum: "/fourier-spectrum",
  gallery: "/gallery",
} as const;

export interface NavItem {
  id: string;
  label: string;
  path: (typeof ROUTES)[keyof typeof ROUTES];
  icon: string;
  description: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "home",
    label: "Home",
    path: ROUTES.home,
    icon: "home",
    description: "Overview of PixelBooth and its three core pillars.",
  },
  {
    id: "photo-booth",
    label: "Photo Booth",
    path: ROUTES.photoBooth,
    icon: "photo_camera",
    description: "Live camera, optical calibration, filters and self-timer.",
  },
  {
    id: "result-and-edit",
    label: "Result & Edit",
    path: ROUTES.resultEdit,
    icon: "tune",
    description: "Edit the captured photo, compare before/after, download.",
  },
  {
    id: "image-analysis",
    label: "Image Analysis",
    path: ROUTES.imageAnalysis,
    icon: "insights",
    description: "Metrics, RGB/Y histograms, transforms and kernel inspector.",
  },
  {
    id: "fourier-spectrum",
    label: "Fourier Spectrum",
    path: ROUTES.fourierSpectrum,
    icon: "graphic_eq",
    description: "2D FFT, low/high-pass filtering and IFFT reconstruction.",
  },
  {
    id: "gallery",
    label: "Gallery",
    path: ROUTES.gallery,
    icon: "photo_library",
    description: "Saved photos: open, delete and download.",
  },
];
