// Firebase del lado del cliente (panel). Inicialización perezosa para no romper el prerender
// cuando faltan variables de entorno.
import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function firebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL);
}

export function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getDb() {
  return getDatabase(getFirebaseApp());
}

let authReady = null;
export function getAuthClient() {
  const auth = getAuth(getFirebaseApp());
  if (!authReady) authReady = setPersistence(auth, browserLocalPersistence).catch(() => {});
  return auth;
}
