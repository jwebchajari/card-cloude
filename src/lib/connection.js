"use client";
import { firebaseConfig } from "./firebase";

/** Solo incluye datos públicos: ninguna clave privada sale de CardCloude. */
export function buildEnvFile({ slug, url = "" }) {
  return [
    `# Conexión de ${slug}, generada por CardCloude.`,
    "# Guardalo como .env.local en el proyecto del local y cargá lo mismo en Vercel.",
    `NEXT_PUBLIC_SITE_URL=${url}`,
    `NEXT_PUBLIC_LOCAL_NAME=${slug}`,
    "",
    `NEXT_PUBLIC_FIREBASE_API_KEY=${firebaseConfig.apiKey || ""}`,
    `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${firebaseConfig.authDomain || ""}`,
    `NEXT_PUBLIC_FIREBASE_DATABASE_URL=${firebaseConfig.databaseURL || ""}`,
    `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${firebaseConfig.projectId || ""}`,
    `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${firebaseConfig.storageBucket || ""}`,
    `NEXT_PUBLIC_FIREBASE_SENDER_ID=${firebaseConfig.messagingSenderId || ""}`,
    `NEXT_PUBLIC_FIREBASE_APP_ID=${firebaseConfig.appId || ""}`,
    "",
    `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""}`,
    `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=${process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""}`,
    "",
  ].join("\n");
}

export function downloadEnvFile(local) {
  const blob = new Blob([buildEnvFile(local)], { type: "text/plain;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `${local.slug}.env.local`;
  link.click();
  URL.revokeObjectURL(href);
}
