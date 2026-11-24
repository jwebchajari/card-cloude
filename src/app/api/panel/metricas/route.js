import { bearer } from "@/lib/auth-server";
import { getAdmin } from "@/lib/firebase-admin";

const fail = (code, status) => Response.json({ ok: false, code }, { status, headers: { "cache-control": "no-store" } });

// Solo root puede leer las métricas del sitio.
export async function GET(request) {
  const admin = getAdmin();
  if (!admin) return fail("admin/not-configured", 503);

  let uid;
  try {
    uid = (await admin.auth.verifyIdToken(bearer(request), true)).uid;
  } catch {
    return fail("PERMISSION_DENIED", 401);
  }

  try {
    const isRoot = (await admin.db.ref(`usuarios/${uid}/superadmin`).get()).val() === true;
    if (!isRoot) return fail("PERMISSION_DENIED", 403);
    const data = (await admin.db.ref("metricas/sitio").get()).val() || {};
    return Response.json({ ok: true, data }, { headers: { "cache-control": "no-store" } });
  } catch {
    return fail("admin/failed", 500);
  }
}
