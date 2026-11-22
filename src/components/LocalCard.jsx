"use client";
import { useCallback, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { cldUrl } from "@/lib/cloudinary-url";
import s from "@/app/landing.module.css";

function initials(nombre) {
  const words = String(nombre || "").trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || "?").slice(0, 2)).toUpperCase();
}

/** Marca una URL como fallida. Es idempotente: el mismo error puede llegar dos veces al hidratar. */
function useFailedImages() {
  const [failed, setFailed] = useState([]);
  const mark = useCallback((url) => setFailed((list) => (list.includes(url) ? list : [...list, url])), []);
  const check = useCallback((img) => {
    if (img?.complete && img.naturalWidth === 0) mark(img.getAttribute("src"));
  }, [mark]);
  return { failed, mark, check };
}

export default function LocalCard({ local }) {
  const { failed, mark, check } = useFailedImages();
  const logos = local.logo ? [cldUrl(local.logo, "f_auto,q_auto,c_fit,w_320,h_320")] : [`${local.url}/logo.png`, `${local.url}/logo-sm.webp`];
  const logo = logos.find((url) => !failed.includes(url));
  const portada = local.portada ? cldUrl(local.portada, "f_auto,q_auto,c_fill,w_560,h_420") : "";
  const cover = portada && !failed.includes(portada) ? portada : "";
  const detail = [local.rubro, local.ciudad].filter(Boolean).join(" · ");
  const logoImg = logo ? (
    <img key={logo} ref={check} src={logo} alt="" width={160} height={160} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => mark(logo)} />
  ) : (
    <b aria-hidden>{initials(local.nombre)}</b>
  );

  return (
    <li>
      <a className={s.localCard} href={local.url} target="_blank" rel="noopener noreferrer" aria-label={`Ver la carta de ${local.nombre}`}>
        <span className={s.cover}>
          {cover ? (
            <img key={cover} ref={check} src={cover} alt="" width={560} height={420} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => mark(cover)} />
          ) : (
            <span className={s.coverLogo}>{logoImg}</span>
          )}
        </span>
        <span className={`${s.cardBody} ${cover ? s.cardBodyBadge : ""}`}>
          {cover ? <span className={s.cardLogo}>{logoImg}</span> : null}
          <strong>{local.nombre}</strong>
          {detail ? <small>{detail}</small> : null}
          <span className={s.cardCta}>Ver carta <ArrowUpRight size={17} aria-hidden /></span>
        </span>
      </a>
    </li>
  );
}
