export type KernelMatrix = number[][];

export interface KernelPreset {
  id: string;
  label: string;
  /** Nama pendek untuk judul panel, mis. "Sobel Horizontal Gradient (G_x)". */
  title: string;
  matrix: KernelMatrix;
  /** Pembagi normalisasi hasil konvolusi. */
  divisor: number;
  description: string;
}

export const SOBEL_GX: KernelMatrix = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
];

export const SOBEL_GY: KernelMatrix = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1],
];

export const KERNEL_PRESETS: readonly KernelPreset[] = [
  {
    id: "sobel-gx",
    label: "Sobel Gx",
    title: "Sobel Horizontal Gradient (G_x)",
    matrix: SOBEL_GX,
    divisor: 1,
    description: "First difference across columns: detects vertical edges.",
  },
  {
    id: "sobel-gy",
    label: "Sobel Gy",
    title: "Sobel Vertical Gradient (G_y)",
    matrix: SOBEL_GY,
    divisor: 1,
    description: "First difference across rows: detects horizontal edges.",
  },
  {
    id: "laplacian",
    label: "Laplacian 3×3",
    title: "Laplacian (4-neighbour)",
    matrix: [
      [0, 1, 0],
      [1, -4, 1],
      [0, 1, 0],
    ],
    divisor: 1,
    description: "Second derivative: highlights regions of rapid intensity change.",
  },
  {
    id: "gaussian",
    label: "Gaussian Blur 3×3",
    title: "Gaussian Blur 3×3",
    matrix: [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1],
    ],
    divisor: 16,
    description: "Weighted average: low-pass smoothing and de-noising.",
  },
  {
    id: "sharpen",
    label: "Sharpen (High Boost)",
    title: "Sharpen (High Boost)",
    matrix: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
    divisor: 1,
    description: "Identity plus Laplacian: boosts high-frequency detail.",
  },
];

/** Format angka kernel dengan tanda eksplisit untuk nilai positif: 1 -> "+1", -2 -> "-2", 0 -> "0". */
export function formatKernelValue(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}
