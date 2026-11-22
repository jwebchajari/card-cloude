import { verifyAccess } from "@/lib/auth-server";

const DB_URL = (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "").replace(/\/+$/, "");

// El panel central avisa al sitio del local. Va de servidor a servidor para no requerir CORS.
// La URL sale del directorio, que solo root puede escribir, nunca del pedido.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const slug = String(body.local || "");
  const action = body.action === "cleanup" ? "cleanup" : "revalidar";
  const imageUrl = String(body.url || "");
  const access = await verifyAccess(request, slug);
  if (!access) return Response.json({ ok: false }, { status: 401 });
  if (action === "cleanup" && !/^https:\/\//.test(imageUrl)) return Response.json({ ok: false }, { status: 400 });

  try {
    const res = await fetch(`${DB_URL}/directorio/${slug}/url.json`, { cache: "no-store" });
    const site = res.ok ? await res.json() : "";
    if (typeof site !== "string" || !/^https:\/\//i.test(site)) return Response.json({ ok: false, reason: "sin-sitio" });
    const path = action === "cleanup" ? "/api/cloudinary/cleanup" : "/api/revalidar";
    const forwarded = await fetch(`${site.replace(/\/+$/, "")}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${access.token}` },
      body: JSON.stringify(action === "cleanup" ? { local: slug, url: imageUrl } : { local: slug }),
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return Response.json({ ok: forwarded.ok });
  } catch {
    return Response.json({ ok: false, reason: "sitio-no-responde" });
  }
}
