import { cacheLife, cacheTag } from "next/cache";
import { MAX_LOCALES, pickDaily } from "./rotacion";

const DB_URL = (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "").replace(/\/+$/, "");
const DAY_MS = 86400000;
const isHttps = (v) => typeof v === "string" && /^https:\/\//i.test(v);

/** Primera foto de un producto visible, para locales sin portada elegida. */
async function firstPhoto(slug) {
  try {
    const res = await fetch(`${DB_URL}/locales/${slug}/comidas.json`);
    if (!res.ok) return "";
    const comidas = (await res.json()) || {};
    return Object.values(comidas).find((c) => c && !c.oculto && isHttps(c.imagen))?.imagen || "";
  } catch {
    return "";
  }
}

/** La foto elegida por root; "logo" pide no usar foto; sin elección usa la primera disponible. */
async function resolveCover(local) {
  if (local.portada === "logo") return "";
  return isHttps(local.portada) ? local.portada : firstPhoto(local.slug);
}

/** Hasta MAX_LOCALES locales visibles, con su logo y su foto de fondo. */
export async function getDirectorio() {
  "use cache";
  cacheLife("minutes");
  cacheTag("directorio");
  if (!DB_URL) return { locales: [], total: 0 };
  try {
    const res = await fetch(`${DB_URL}/directorio.json`);
    if (!res.ok) return { locales: [], total: 0 };
    const data = (await res.json()) || {};
    const visibles = Object.entries(data)
      .filter(([, l]) => l?.visible === true && isHttps(l.url))
      .map(([slug, l]) => ({ slug, nombre: l.nombre, ciudad: l.ciudad || "", rubro: l.rubro || "", url: l.url.replace(/\/+$/, ""), logo: isHttps(l.logo) ? l.logo : "", portada: l.portada || "" }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    const elegidos = pickDaily(visibles, MAX_LOCALES, Math.floor(Date.now() / DAY_MS));
    const locales = await Promise.all(elegidos.map(async (l) => ({ ...l, portada: await resolveCover(l) })));
    return { locales, total: visibles.length };
  } catch {
    return { locales: [], total: 0 };
  }
}
