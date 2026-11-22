"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Share2 } from "lucide-react";
import ShareLocal from "@/components/ShareLocal";
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

/** Tarjeta del inicio. Con `preview` no enlaza y `logoSlot` reemplaza al logo guardado. */
export default function LocalCard({ local, preview = false, logoSlot = null, coverSlot = null, internal = false, hidden = false }) {
  const { failed, mark, check } = useFailedImages();
  const site = String(local.url || "").replace(/\/+$/, "");
  const logos = local.logo ? [cldUrl(local.logo, "f_auto,q_auto,c_fit,w_320,h_320")] : site ? [`${site}/logo.png`, `${site}/logo-sm.webp`] : [];
  const logo = logos.find((url) => !failed.includes(url));
  const portada = local.portada ? cldUrl(local.portada, "f_auto,q_auto,c_fill,w_560,h_420") : "";
  const cover = portada && !failed.includes(portada) ? portada : "";
  const detail = [local.rubro, local.ciudad].filter(Boolean).join(" · ");
  const logoImg = logoSlot || (logo ? (
    <img key={logo} ref={check} src={logo} alt="" width={160} height={160} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => mark(logo)} />
  ) : (
    <b aria-hidden>{initials(local.nombre)}</b>
  ));

  const content = (
    <>
      <span className={s.cover}>
        {coverSlot || (cover ? (
          <img key={cover} ref={check} src={cover} alt="" width={560} height={420} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => mark(cover)} />
        ) : null)}
        {coverSlot || cover ? null : (
          <span className={s.coverLogo}>{logoImg}</span>
        )}
      </span>
      <span className={`${s.cardBody} ${coverSlot || cover ? s.cardBodyBadge : ""}`}>
        {coverSlot || cover ? <span className={s.cardLogo}>{logoImg}</span> : null}
        <strong>{local.nombre || "Nombre del local"}</strong>
        {detail ? <small>{detail}</small> : null}
        <span className={s.cardCta}>{internal ? "Ver local" : "Ver carta"} <ArrowUpRight size={17} aria-hidden /></span>
      </span>
    </>
  );

  if (preview) {
    return (
      <div className={`${s.localCard} ${s.localCardPreview}`} aria-label="Vista previa de la tarjeta">
        {content}
        <span className={s.shareBtn} aria-hidden><Share2 size={17} /></span>
      </div>
    );
  }
  return (
    <li className={s.cardItem} hidden={hidden}>
      {internal ? (
        <Link className={s.localCard} href={`/locales/${local.slug}`} aria-label={`Ver ${local.nombre}`}>
          {content}
        </Link>
      ) : (
        <a className={s.localCard} href={local.url} target="_blank" rel="noopener noreferrer" aria-label={`Ver la carta de ${local.nombre}`}>
          {content}
        </a>
      )}
      <ShareLocal nombre={local.nombre} url={local.url} />
    </li>
  );
}
