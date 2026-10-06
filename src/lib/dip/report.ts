import type { Analysis } from "./analyze";
import type { LoadedImage } from "./image";

const q = (s: string) => `"${s.replace(/"/g, '""')}"`;

export function buildReportCsv(image: LoadedImage, a: Analysis): string {
  const rows: string[] = ["section,key,value"];
  const add = (section: string, key: string, value: string | number) =>
    rows.push(`${section},${q(key)},${typeof value === "number" ? value : q(value)}`);

  add("source", "label", image.label);
  add("source", "width_px", image.sourceWidth);
  add("source", "height_px", image.sourceHeight);
  add("analysis", "width_px", a.width);
  add("analysis", "height_px", a.height);
  add("analysis", "total_pixels", a.total);
  add("analysis", "shannon_entropy_bits", Number(a.entropy.toFixed(4)));
  add("analysis", "otsu_threshold", a.otsu);
  add("analysis", "edge_density_percent", Number(a.edgeDensity.toFixed(3)));

  rows.push("", "channel,mean,std_dev,skewness,peak,min,max");
  for (const key of ["r", "g", "b", "y"] as const) {
    const s = a.stats[key];
    rows.push(
      [key.toUpperCase(), s.mean.toFixed(3), s.std.toFixed(3), s.skew.toFixed(4), s.peak, s.min, s.max].join(","),
    );
  }

  rows.push("", "bin,R,G,B,Y");
  for (let k = 0; k < 256; k++) {
    rows.push([k, a.hist.r[k], a.hist.g[k], a.hist.b[k], a.hist.y[k]].join(","));
  }
  return rows.join("\n");
}
