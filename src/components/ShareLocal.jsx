"use client";
import { Share2 } from "lucide-react";
import s from "@/app/landing.module.css";

/** Comparte la carta del local con el menú nativo; si no existe, abre WhatsApp. */
export default function ShareLocal({ nombre, url, className = s.shareBtn, label = "" }) {
  async function share() {
    const text = `Mirá la carta de ${nombre}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: nombre, text, url });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <button type="button" className={className} onClick={share} aria-label={`Compartir la carta de ${nombre}`} title="Compartir carta">
      <Share2 size={17} aria-hidden /> {label || null}
    </button>
  );
}
