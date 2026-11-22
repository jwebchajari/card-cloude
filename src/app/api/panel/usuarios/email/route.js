import { bearer } from "@/lib/auth-server";
import { getAdmin } from "@/lib/firebase-admin";

const UID_RE = /^[A-Za-z0-9]{1,128}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KNOWN_ERRORS = { "auth/email-already-exists": 409, "auth/invalid-email": 400, "auth/user-not-found": 404 };

const fail = (code, status) => Response.json({ ok: false, code }, { status });

// Solo root puede cambiar el email de ingreso de una cuenta.
export async function POST(request) {
  const admin = getAdmin();
  if (!admin) return fail("admin/not-configured", 503);

  let callerUid;
  try {
    callerUid = (await admin.auth.verifyIdToken(bearer(request), true)).uid;
  } catch {
    return fail("PERMISSION_DENIED", 401);
  }

  try {
    const isRoot = (await admin.db.ref(`usuarios/${callerUid}/superadmin`).get()).val() === true;
    if (!isRoot) return fail("PERMISSION_DENIED", 403);

    const body = await request.json().catch(() => ({}));
    const uid = String(body.uid || "");
    const email = String(body.email || "").trim();
    if (!UID_RE.test(uid)) return fail("auth/user-not-found", 404);
    if (email.length > 120 || !EMAIL_RE.test(email)) return fail("auth/invalid-email", 400);
    if (!(await admin.db.ref(`usuarios/${uid}`).get()).exists()) return fail("auth/user-not-found", 404);

    await admin.auth.updateUser(uid, { email, emailVerified: false });
    await admin.db.ref(`usuarios/${uid}/email`).set(email);
    return Response.json({ ok: true, email });
  } catch (err) {
    const status = KNOWN_ERRORS[err?.code];
    return status ? fail(err.code, status) : fail("admin/failed", 500);
  }
}
