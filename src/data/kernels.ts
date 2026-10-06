export type KernelMatrix = number[][];

export interface KernelPreset {
  id: string;
  label: string;
  /** Nama pendek untuk judul panel, mis. "Gradien Horizontal Sobel (G_x)". */
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
    title: "Gradien Horizontal Sobel (G_x)",
    matrix: SOBEL_GX,
    divisor: 1,
    description: "Selisih pertama antar kolom: mendeteksi tepi vertikal.",
  },
  {
    id: "sobel-gy",
    label: "Sobel Gy",
    title: "Gradien Vertikal Sobel (G_y)",
    matrix: SOBEL_GY,
    divisor: 1,
    description: "Selisih pertama antar baris: mendeteksi tepi horizontal.",
  },
  {
    id: "laplacian",
    label: "Laplacian 3×3",
    title: "Laplacian (4-tetangga)",
    matrix: [
      [0, 1, 0],
      [1, -4, 1],
      [0, 1, 0],
    ],
    divisor: 1,
    description: "Turunan kedua: menonjolkan area dengan perubahan intensitas cepat.",
  },
  {
    id: "gaussian",
    label: "Blur Gaussian 3×3",
    title: "Blur Gaussian 3×3",
    matrix: [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1],
    ],
    divisor: 16,
    description: "Rata-rata berbobot: penghalusan low-pass dan pengurangan noise.",
  },
  {
    id: "sharpen",
    label: "Penajaman (High Boost)",
    title: "Penajaman (High Boost)",
    matrix: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
    divisor: 1,
    description: "Identitas ditambah Laplacian: memperkuat detail frekuensi tinggi.",
  },
];

/** Format angka kernel dengan tanda eksplisit untuk nilai positif: 1 -> "+1", -2 -> "-2", 0 -> "0". */
export function formatKernelValue(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}
