import { ServerValue } from "firebase-admin/database";
import { TIMEZONE } from "@/lib/catalogo";
import { getAdmin } from "@/lib/firebase-admin";

const EVENTS = new Set(["visitas", "whatsapp"]);
const BOTS = /bot|crawl|spider|slurp|preview|lighthouse|headless/i;
const MAX_BODY = 200;
const WINDOW_MS = 60000;
const MAX_PER_WINDOW = 30;
const hits = new Map(); // Solo en memoria: la IP nunca se guarda en la base.

const done = (status = 204) => new Response(null, { status });

function limited(request) {
  const ip = (request.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const entry = hits.get(ip);
  if (!entry || now - entry.at > WINDOW_MS) {
    hits.set(ip, { at: now, n: 1 });
    return false;
  }
  entry.n += 1;
  return entry.n > MAX_PER_WINDOW;
}

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

// Cuenta eventos anónimos del sitio. El nodo `metricas` no es accesible desde el navegador.
export async function POST(request) {
  if (request.headers.get("sec-fetch-site") !== "same-origin") return done(403);
  if (BOTS.test(request.headers.get("user-agent") || "")) return done();
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY) return done(413);
  if (limited(request)) return done(429);

  const raw = await request.text().catch(() => "");
  if (raw.length > MAX_BODY) return done(413);
  let event = "";
  try {
    event = String(JSON.parse(raw)?.event || "");
  } catch {
    return done(400);
  }
  if (!EVENTS.has(event)) return done(400);

  const admin = getAdmin();
  if (!admin) return done(503);
  try {
    await admin.db.ref(`metricas/sitio/${event}`).update({
      total: ServerValue.increment(1),
      [`dias/${today()}`]: ServerValue.increment(1),
    });
    return done();
  } catch {
    return done(500);
  }
}
