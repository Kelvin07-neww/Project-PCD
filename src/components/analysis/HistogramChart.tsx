export interface HistogramSeries {
  id: string;
  bins: ArrayLike<number>;
  stroke: string;
  fill?: string;
  fillOpacity?: number;
  dashed?: boolean;
  strokeWidth?: number;
}

interface HistogramChartProps {
  series: readonly HistogramSeries[];
  width?: number;
  height?: number;
  className?: string;
  label: string;
}

/** Moving average sederhana agar kurva histogram terbaca (data asli tetap 256 bin). */
function smooth(bins: ArrayLike<number>, radius = 2): number[] {
  const out: number[] = [];
  for (let k = 0; k < 256; k++) {
    let sum = 0;
    let n = 0;
    for (let j = k - radius; j <= k + radius; j++) {
      if (j >= 0 && j < 256) {
        sum += bins[j];
        n++;
      }
    }
    out.push(sum / n);
  }
  return out;
}

export function HistogramChart({ series, width = 1000, height = 240, className, label }: HistogramChartProps) {
  const smoothed = series.map((s) => smooth(s.bins));
  const max = Math.max(1, ...smoothed.map((values) => Math.max(...values)));

  const line = (values: number[]) =>
    values
      .map((v, k) => {
        const x = (k / 255) * width;
        const y = height - (v / max) * (height - 6);
        return `${k === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <svg
      role="img"
      aria-label={label}
      className={className}
      fill="none"
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
    >
      {series.map((s, i) => {
        const d = line(smoothed[i]);
        return (
          <g key={s.id}>
            {s.fill && (
              <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill={s.fill} fillOpacity={s.fillOpacity ?? 0.2} />
            )}
            <path
              d={d}
              stroke={s.stroke}
              strokeWidth={s.strokeWidth ?? 2}
              strokeDasharray={s.dashed ? "4 2" : undefined}
              vectorEffect="non-scaling-stroke"
              opacity={s.dashed ? 0.6 : 1}
            />
          </g>
        );
      })}
    </svg>
  );
}
