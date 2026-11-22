"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { get, ref, set } from "firebase/database";
import { firebaseConfigured, getAuthClient, getDb } from "./firebase";

const ERRORS = {
  "auth/invalid-credential": "El email o la contraseña no son correctos.",
  "auth/invalid-login-credentials": "El email o la contraseña no son correctos.",
  "auth/wrong-password": "El email o la contraseña no son correctos.",
  "auth/user-not-found": "No hay una cuenta con ese email.",
  "auth/invalid-email": "Revisá el email, no tiene un formato válido.",
  "auth/user-disabled": "Esta cuenta está deshabilitada.",
  "auth/too-many-requests": "Demasiados intentos. Esperá unos minutos y probá de nuevo.",
  "auth/network-request-failed": "Sin conexión. Revisá tu internet y probá de nuevo.",
  "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase (Auth > Authorized domains).",
  "auth/operation-not-allowed": "El ingreso con email y contraseña no está habilitado en Firebase.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese email.",
  "auth/email-already-exists": "Ya existe una cuenta con ese email.",
  "admin/not-configured": "Falta configurar la clave de Firebase en el servidor para cambiar emails.",
  "auth/weak-password": "La contraseña tiene que tener al menos 6 caracteres.",
  "auth/missing-password": "Escribí la contraseña.",
  PERMISSION_DENIED: "No tenés permiso para hacer esto.",
};

export function authError(err) {
  const code = err?.code || err?.message || "";
  for (const [k, v] of Object.entries(ERRORS)) if (String(code).includes(k)) return v;
  return "Algo salió mal. Probá de nuevo.";
}

export async function login(email, password) {
  const auth = getAuthClient();
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function logout() {
  await signOut(getAuthClient());
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(getAuthClient(), email.trim());
}

export async function getProfile(uid) {
  const snap = await get(ref(getDb(), `usuarios/${uid}`));
  return snap.exists() ? snap.val() : null;
}

export async function requestAccess(user) {
  await set(ref(getDb(), `solicitudes/${user.uid}`), {
    email: user.email || "",
    nombre: user.displayName || "",
    fecha: Date.now(),
  });
}

export function profileLocales(profile) {
  return Object.entries(profile?.locales || {})
    .filter(([, v]) => v === true)
    .map(([k]) => k);
}

export function canEdit(profile, slug) {
  return Boolean(profile?.superadmin) || profile?.locales?.[slug] === true;
}

/** { status: "loading" | "out" | "in" | "error" | "unconfigured", user, profile } */
export function useSession() {
  // Las variables NEXT_PUBLIC_* son iguales en servidor y cliente: no hay desajuste de hidratación.
  const configured = firebaseConfigured();
  const [state, setState] = useState({ status: configured ? "loading" : "unconfigured", user: null, profile: null });

  useEffect(() => {
    if (!configured) return undefined;
    const auth = getAuthClient();
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ status: "out", user: null, profile: null });
        return;
      }
      // Un error de lectura no significa "sin locales": no debe generar una solicitud de acceso.
      try {
        const profile = await getProfile(user.uid);
        setState({ status: "in", user, profile });
      } catch {
        setState({ status: "error", user, profile: null });
      }
    });
  }, [configured]);

  return state;
}

export async function idToken() {
  const user = getAuthClient().currentUser;
  return user ? user.getIdToken() : null;
}
