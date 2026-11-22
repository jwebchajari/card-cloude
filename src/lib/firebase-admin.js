// Credencial privada: este módulo nunca debe llegar al navegador.
import "server-only";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

const APP_NAME = "cardcloude-admin";

/** Devuelve null si faltan las variables del service account. */
export function getAdmin() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!projectId || !databaseURL || !clientEmail || !privateKey) return null;

  const app = getApps().some((a) => a.name === APP_NAME)
    ? getApp(APP_NAME)
    : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), databaseURL }, APP_NAME);
  return { auth: getAuth(app), db: getDatabase(app) };
}
