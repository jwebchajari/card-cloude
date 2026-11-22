import { NextResponse } from "next/server";

const DB_URL = (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "").replace(/\/+$/, "");
const SLUG_RE = /^[a-z0-9-]{2,40}$/;
const TTL_MS = 60000;
let cache = { at: 0, slugs: null };

async function visibleSlugs() {
  if (cache.slugs && Date.now() - cache.at < TTL_MS) return cache.slugs;
  const res = await fetch(`${DB_URL}/directorio.json`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error("directorio");
  const data = (await res.json()) || {};
  const slugs = new Set(Object.entries(data).filter(([slug, l]) => SLUG_RE.test(slug) && l?.visible === true && /^https:\/\//i.test(l.url || "")).map(([slug]) => slug));
  cache = { at: Date.now(), slugs };
  return slugs;
}

// La página de un local se transmite por partes: el estado 404 hay que decidirlo antes de empezar.
export async function proxy(request) {
  const slug = request.nextUrl.pathname.split("/")[2] || "";
  try {
    if ((await visibleSlugs()).has(slug)) return NextResponse.next();
  } catch {
    // Si la base no responde, la página resuelve el caso sin bloquear a los visitantes.
    return NextResponse.next();
  }
  return NextResponse.rewrite(new URL("/pagina-no-encontrada", request.url), { status: 404 });
}

export const config = { matcher: "/locales/:slug" };
