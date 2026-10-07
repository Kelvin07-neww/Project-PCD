import { useCallback, useEffect, useRef, useState } from "react";
import { loadFromFile, loadFromUrl, loadTestImage, type LoadedImage } from "@/lib/dip/image";
import { getPhoto, listPhotos } from "@/lib/gallery";

const LAST_CAPTURE_KEY = "pixelbooth:last-capture";

const FALLBACK_NOTICE =
  "Potret uji jarak jauh tidak dapat dibaca oleh canvas (CORS atau offline), sehingga digunakan adegan sintetis bawaan. Unggah foto Anda sendiri untuk analisis nyata.";

interface UseAnalysisImageOptions {
  photoId?: number | null;
  preferLastCapture?: boolean;
}

export function useAnalysisImage(options: UseAnalysisImageOptions = {}) {
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

  const loadLinkedPhoto = useCallback(async () => {
    const id = ++ticket.current;
    setLoading(true);
    setNotice(null);
    try {
      let url: string | null = null;
      let label = "Foto Photo Booth";
      if (options.photoId) {
        const photo = await getPhoto(options.photoId);
        if (photo) {
          url = photo.url;
          label = `Gallery #${photo.id}`;
        }
      }
      if (!url && options.preferLastCapture) {
        url = localStorage.getItem(LAST_CAPTURE_KEY);
        label = "Capture terakhir Photo Booth";
      }
      if (!url && options.preferLastCapture) {
        const latest = (await listPhotos())[0];
        if (latest) {
          url = latest.url;
          label = `Gallery #${latest.id}`;
        }
      }
      if (!url) return false;
      const next = await loadFromUrl(url, label);
      if (id !== ticket.current) return true;
      setImage(next);
      setLoading(false);
      return true;
    } catch {
      if (id === ticket.current) {
        setNotice("Foto dari Photo Booth/Gallery tidak dapat dibaca. Gambar uji akan digunakan.");
      }
      return false;
    }
  }, [options.photoId, options.preferLastCapture]);

  useEffect(() => {
    (async () => {
      if (await loadLinkedPhoto()) return;
      void loadTest();
    })();
    return () => {
      ticket.current++;
    };
  }, [loadLinkedPhoto, loadTest]);

  return { image, loading, notice, loadTest, loadFile };
}
