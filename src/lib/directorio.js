import { cacheLife, cacheTag } from "next/cache";
import { normalizeDatos, normalizeProducts } from "./menu-shared";
import { MAX_LOCALES, pickDaily } from "./rotacion";
import { normalizeHorarios } from "@/utils/horarios";

const DB_URL = (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "").replace(/\/+$/, "");
const DAY_MS = 86400000;
const SLUG_RE = /^[a-z0-9-]{2,40}$/;
const isHttps = (v) => typeof v === "string" && /^https:\/\//i.test(v);

async function readJson(path) {
  if (!DB_URL) return null;
  try {
    const res = await fetch(`${DB_URL}/${path}.json`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

function firstPhotoOf(comidas) {
  return Object.values(comidas || {}).find((c) => c && !c.oculto && isHttps(c.imagen))?.imagen || "";
}

/** La foto elegida por root; "logo" pide no usar foto; sin elección usa la primera disponible. */
async function resolveCover(local) {
  if (local.portada === "logo") return "";
  return isHttps(local.portada) ? local.portada : firstPhotoOf(await readJson(`locales/${local.slug}/comidas`));
}

/** Todos los locales marcados como visibles, sin portada resuelta. */
export async function getVisibles() {
  "use cache";
  cacheLife("minutes");
  cacheTag("directorio");
  const data = (await readJson("directorio")) || {};
  return Object.entries(data)
    .filter(([slug, l]) => SLUG_RE.test(slug) && l?.visible === true && isHttps(l.url))
    .map(([slug, l]) => ({ slug, nombre: l.nombre, ciudad: l.ciudad || "", rubro: l.rubro || "", url: l.url.replace(/\/+$/, ""), logo: isHttps(l.logo) ? l.logo : "", portada: l.portada || "" }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Hasta MAX_LOCALES locales para el inicio, con su logo y su foto de fondo. */
export async function getDirectorio() {
  "use cache";
  cacheLife("minutes");
  cacheTag("directorio");
  const visibles = await getVisibles();
  const elegidos = pickDaily(visibles, MAX_LOCALES, Math.floor(Date.now() / DAY_MS));
  const locales = await Promise.all(elegidos.map(async (l) => ({ ...l, portada: await resolveCover(l) })));
  return { locales, total: visibles.length };
}

/** Todos los locales visibles con portada, para el directorio y el sitemap. */
export async function getTodosLosLocales() {
  "use cache";
  cacheLife("minutes");
  cacheTag("directorio");
  const visibles = await getVisibles();
  return Promise.all(visibles.map(async (l) => ({ ...l, portada: await resolveCover(l) })));
}

/** Ficha pública de un local visible, o null si no existe o está oculto. */
export async function getLocalPublico(slug) {
  "use cache";
  cacheLife("minutes");
  cacheTag("directorio", `local-${slug}`);
  if (!SLUG_RE.test(String(slug || ""))) return null;
  const visibles = await getVisibles();
  const ficha = visibles.find((l) => l.slug === slug);
  if (!ficha) return null;
  const [comidas, datos, horarios] = await Promise.all([readJson(`locales/${slug}/comidas`), readJson(`locales/${slug}/datos`), readJson(`locales/${slug}/horarios`)]);
  const productos = normalizeProducts(comidas).filter((p) => !p.oculto);
  const portada = ficha.portada === "logo" ? "" : isHttps(ficha.portada) ? ficha.portada : firstPhotoOf(comidas);
  const otros = visibles.filter((l) => l.slug !== slug).slice(0, 4).map((l) => ({ slug: l.slug, nombre: l.nombre, rubro: l.rubro, ciudad: l.ciudad }));
  return { ...ficha, portada, productos, datos: normalizeDatos(datos), horarios: normalizeHorarios(horarios), otros };
}
