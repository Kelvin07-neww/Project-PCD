import { useCallback, useEffect, useRef, useState } from "react";
import { loadFromFile, loadTestImage, type LoadedImage } from "@/lib/dip/image";

const FALLBACK_NOTICE =
  "The remote test portrait could not be read by the canvas (CORS or offline), so a built-in synthetic scene is used. Upload your own photo for real analysis.";

export function useAnalysisImage() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const ticket = useRef(0);

  const loadTest = useCallback(async () => {
    const id = ++ticket.current;
    setLoading(true);
    setNotice(null);
    const { image: next, fellBack } = await loadTestImage();
    if (id !== ticket.current) return; // permintaan lebih baru sudah menggantikan
    setImage(next);
    setNotice(fellBack ? FALLBACK_NOTICE : null);
    setLoading(false);
  }, []);

  const loadFile = useCallback(async (file: File) => {
    const id = ++ticket.current;
    setLoading(true);
    setNotice(null);
    try {
      const next = await loadFromFile(file);
      if (id !== ticket.current) return;
      setImage(next);
    } catch {
      if (id !== ticket.current) return;
      setNotice("That file could not be read as an image. The previous image is still shown.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTest();
    return () => {
      ticket.current++;
    };
  }, [loadTest]);

  return { image, loading, notice, loadTest, loadFile };
}
