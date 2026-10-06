import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { ROUTES } from "@/data/navItems";

const PIPELINE = [
  { symbol: "f(x, y)", caption: "Domain Spasial", tone: "text-tertiary", box: "bg-surface-container" },
  { symbol: "Y(x, y)", caption: "Luminositas Grayscale", tone: "text-on-surface", box: "bg-surface-container" },
  { symbol: "(-1)^(x+y)", caption: "Pemusatan Spektrum 2D", tone: "text-secondary", box: "bg-surface-container" },
  { symbol: "2D FFT", caption: "Radix-2 Cooley-Tukey", tone: "text-primary", box: "bg-surface-container" },
  { symbol: "|F(u, v)|", caption: "Spektrum Magnitudo Log", tone: "text-on-secondary-container", box: "bg-secondary-container/40" },
] as const;

export function FourierPrimer() {
  return (
    <div className="flex flex-col gap-space-lg rounded-xl bg-surface-container p-space-lg shadow-xl">
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center gap-space-xs font-metric-mono-sm text-metric-mono-sm text-secondary">
          <Icon name="waves" className="text-[16px]" />
          <span>TRANSFORMASI DOMAIN FREKUENSI</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Transformasi Fourier Diskret 2D (DFT / FFT 2D)</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Dekomposisi sinyal luminositas spasial 2D menjadi basis frekuensi sinusoidal ortogonal F(u,v) = R(u,v) + j I(u,v).
        </p>
      </div>

      <div className="w-full overflow-x-auto rounded-lg bg-surface-container-lowest p-space-md">
        <ol className="flex min-w-[760px] items-center justify-between gap-space-sm font-metric-mono-sm text-metric-mono-sm">
          {PIPELINE.flatMap((step, i) => {
            const node = (
              <li key={step.symbol} className={`flex w-36 flex-col items-center rounded p-2 text-center ${step.box}`}>
                <span className={`font-bold ${step.tone}`}>{step.symbol}</span>
                <span className="text-[10px] text-on-surface-variant">{step.caption}</span>
              </li>
            );
            return i < PIPELINE.length - 1
              ? [node, <Icon key={`a${i}`} name="arrow_forward" className="text-outline" />]
              : [node];
          })}
        </ol>
      </div>

      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        <div className="flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-md">
          <div className="flex items-center gap-space-xs font-headline-md text-headline-md text-primary">
            <Icon name="radio_button_checked" className="text-[18px]" />
            <span>Komponen Frekuensi Rendah (Domain Tengah)</span>
          </div>
          <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
            Merepresentasikan struktur skala besar, pencahayaan halus, dan tonalitas global gambar. Foto natural biasanya menyimpan
            sebagian besar energi sinyalnya di sini. Atenuasi bagian ini menghasilkan isolasi tepi high-pass.
          </p>
        </div>
        <div className="flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-md">
          <div className="flex items-center gap-space-xs font-headline-md text-headline-md text-secondary">
            <Icon name="grain" className="text-[18px]" />
            <span>Komponen Frekuensi Tinggi (Sebaran Tepi)</span>
          </div>
          <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
            Merepresentasikan tepi tajam, tekstur rambut halus, kerutan, dan noise sensor. Berada jauh dari origin DC.
            Atenuasi bagian ini menghasilkan penghalusan seperti Gaussian dan pengurangan noise.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
        <p className="max-w-xl font-body-sm text-body-sm text-on-surface-variant">
          Spektrum live, filtering Butterworth/Gaussian, dan rekonstruksi FFT invers berjalan di lab Fourier khusus.
        </p>
        <Link
          to={ROUTES.fourierSpectrum}
          className="inline-flex items-center gap-space-xs rounded-lg bg-secondary px-space-md py-2 font-label-lg text-label-lg text-on-secondary shadow-[0_0_24px_-2px_rgba(139,92,246,0.4)] outline-none transition-all hover:bg-secondary-fixed focus-visible:ring-2 focus-visible:ring-primary/70"
        >
          <span>Buka Lab Spektrum Fourier</span>
          <Icon name="arrow_forward" className="text-[16px]" />
        </Link>
      </div>
    </div>
  );
}
