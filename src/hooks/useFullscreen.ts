import { useCallback, useEffect, useState } from "react";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== "undefined" && Boolean(document.fullscreenElement),
  );

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn("Fullscreen request failed:", error);
    }
  }, []);

  const supported = typeof document !== "undefined" && document.fullscreenEnabled;

  return { isFullscreen, toggle, supported };
}
