"use client";
import SafeImg from "@/components/SafeImg";
import { cldUrl } from "@/lib/cloudinary-url";
import s from "./dashboard.module.css";

function initials(text) {
  const words = String(text || "").trim().split(/[\s-]+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || "?").slice(0, 2)).toUpperCase();
}

/** Logo del local que se edita: guardado, publicado en su sitio o, si no hay, sus iniciales. */
export default function PanelLogo({ local, ficha, ready }) {
  const site = String(ficha?.url || "").replace(/\/+$/, "");
  const sources = !ready ? [] : ficha?.logo ? [cldUrl(ficha.logo, "f_auto,q_auto,c_fit,w_96,h_96")] : site ? [`${site}/logo.png`, `${site}/logo-sm.webp`] : [];
  const fallback = <b aria-hidden>{ready ? initials(ficha?.nombre || local) : ""}</b>;

  return (
    <span className={s.panelLogo}>
      <SafeImg key={sources.join("|")} sources={sources} alt="" width={38} height={38} fallback={fallback} />
    </span>
  );
}
