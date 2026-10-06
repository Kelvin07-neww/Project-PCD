import { useCallback, useEffect, useRef, useState } from "react";
import { loadFromFile, loadTestImage, type LoadedImage } from "@/lib/dip/image";

const FALLBACK_NOTICE =
  "Potret uji jarak jauh tidak dapat dibaca oleh canvas (CORS atau offline), sehingga digunakan adegan sintetis bawaan. Unggah foto Anda sendiri untuk analisis nyata.";

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
      setNotice("File tersebut tidak dapat dibaca sebagai gambar. Gambar sebelumnya tetap ditampilkan.");
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
