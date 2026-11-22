"use client";
import { useCallback, useState } from "react";

/** Prueba cada URL en orden y muestra `fallback` si ninguna carga. */
export default function SafeImg({ sources, fallback = null, alt = "", ...props }) {
  const [failed, setFailed] = useState([]);
  const mark = useCallback((url) => setFailed((list) => (list.includes(url) ? list : [...list, url])), []);
  const check = useCallback((img) => {
    if (img?.complete && img.naturalWidth === 0) mark(img.getAttribute("src"));
  }, [mark]);
  const src = sources.filter(Boolean).find((url) => !failed.includes(url));
  if (!src) return fallback;
  return <img key={src} ref={check} src={src} alt={alt} decoding="async" referrerPolicy="no-referrer" onError={() => mark(src)} {...props} />;
}
