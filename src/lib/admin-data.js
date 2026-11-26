"use client";
import { deleteApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, inMemoryPersistence, sendPasswordResetEmail, setPersistence, signOut } from "firebase/auth";
import { get, push, ref, remove, runTransaction, set, update } from "firebase/database";
import { firebaseConfig, getAuthClient, getDb } from "./firebase";
import { idToken } from "./session";
import { DEFAULT_FOTO_FORMA, DEFAULT_VERSION_BASE, fotoFormaId, INGREDIENT_GROUPS, MAX_BASE_MEATS, MAX_VERSION_NAME, MEAT_PRICE_KEYS, MIN_MEATS, categoryOf, cleanIngredients, cleanPacks, cleanVersions, hasIngredients, ingredientsText, productPacks, cleanOptions } from "./catalogo";
import { SLUG_RE, slugError } from "./slug";
import { MAX_FRANJAS, WEEK_ORDER, isHHMM } from "@/utils/horarios";

const txt = (v, max) => String(v ?? "").trim().slice(0, max);
const money = (v) => {
  const n = Math.round(Number(String(v ?? "").replace(/[^\d.]/g, "")));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 100000000) : 0;
};

/* ---------------- Panel de cada local ---------------- */

export function cleanComida(raw) {
  // Con venta por cantidad, `valor` es el precio de la menor cantidad y no hay oferta ni carnes.
  const packs = productPacks(raw);
  const valor = packs[0]?.precio ?? money(raw.valor);
  const valorOferta = money(raw.valorOferta);
  const oferta = !packs.length && Boolean(raw.oferta) && valorOferta > 0 && valorOferta < valor;
  const categoria = categoryOf(raw.categoria);
  const imagen = txt(raw.imagen, 2000);
  const med = Number(raw.medallones);
  const out = {
    nombre: txt(raw.nombre, 120),
    descripcion: txt(raw.descripcion, 600),
    categoria,
    valor,
    oferta,
    valorOferta: oferta ? valorOferta : 0,
    imagen: /^https:\/\//i.test(imagen) ? imagen : "",
    oculto: Boolean(raw.oculto),
  };
  const medOk = Number.isInteger(med) && med >= MIN_MEATS && med <= MAX_BASE_MEATS;
  if (packs.length) out.presentaciones = cleanPacks(raw.presentaciones);
  else if (categoria === "hamburguesas") out.medallones = medOk ? med : MIN_MEATS;
  else if (!["bebidas", "frutas", "verduras"].includes(categoria) && medOk) out.medallones = med;
  if (out.medallones) {
    const precios = {};
    for (const [n, k] of Object.entries(MEAT_PRICE_KEYS)) {
      const v = money(raw.precios?.[k]);
      if (Number(n) > out.medallones && v > 0) precios[k] = v;
    }
    if (Object.keys(precios).length) out.precios = precios;
  }
  // Versiones con otro precio (veggie, sin TACC...). No se combinan con la venta por cantidad.
  const versiones = packs.length ? [] : cleanVersions(raw.distinciones);
  if (versiones.length) {
    out.distinciones = versiones;
    out.distincionBase = txt(raw.distincionBase, MAX_VERSION_NAME) || DEFAULT_VERSION_BASE;
  }
  if (hasIngredients(raw.ingredientes)) {
    const clean = cleanIngredients(raw.ingredientes);
    out.ingredientes = Object.fromEntries(INGREDIENT_GROUPS.filter(({ id }) => clean[id].length).map(({ id }) => [id, clean[id]]));
    out.descripcion = txt(ingredientsText(clean), 600);
  }
  return out;
}

export async function getComidas(local) {
  const snap = await get(ref(getDb(), `locales/${local}/comidas`));
  return snap.val() || {};
}

export async function getComida(local, id) {
  const snap = await get(ref(getDb(), `locales/${local}/comidas/${id}`));
  return snap.exists() ? snap.val() : null;
}

export async function saveComida(local, id, data, previousImage = "") {
  const clean = cleanComida(data);
  if (!clean.nombre) throw new Error("Falta el nombre.");
  const db = getDb();
  const key = id || push(ref(db, `locales/${local}/comidas`)).key;
  await set(ref(db, `locales/${local}/comidas/${key}`), clean);
  afterSave(local, previousImage && previousImage !== clean.imagen ? previousImage : "");
  return key;
}

export async function setComidaFlag(local, id, patch) {
  const allowed = {};
  if ("oculto" in patch) allowed.oculto = Boolean(patch.oculto);
  await update(ref(getDb(), `locales/${local}/comidas/${id}`), allowed);
  afterSave(local);
}

export async function deleteComida(local, id, image = "") {
  await remove(ref(getDb(), `locales/${local}/comidas/${id}`));
  afterSave(local, image);
}

export async function getDatos(local) {
  const snap = await get(ref(getDb(), `locales/${local}/datos`));
  return snap.val() || {};
}

export async function getFicha(local) {
  const snap = await get(ref(getDb(), `directorio/${local}`));
  return snap.val();
}

/** Actualiza solo lo que edita este formulario: conserva extras y otras redes del local. */
export async function saveDatos(local, raw) {
  const costo = String(raw.costoEnvio ?? "").trim();
  const costoFuera = String(raw.costoEnvioFuera ?? "").trim();
  const options = cleanOptions(raw.opciones);
  // Con todo activo y nada guardado no hace falta escribir: el valor por defecto ya es activo.
  const saveOptions = raw.tieneOpciones || !options.envio || !options.transferencia || !options.tarjeta;
  await update(ref(getDb(), `locales/${local}/datos`), {
    nombre: txt(raw.nombre, 80),
    whatsapp: txt(raw.whatsapp, 30),
    direccion: txt(raw.direccion, 200),
    alias: txt(raw.alias, 80),
    costoEnvio: costo === "" ? null : money(costo),
    costoEnvioFuera: costoFuera === "" ? null : money(costoFuera),
    "redes/instagram": txt(raw.redes?.instagram, 200),
    "redes/facebook": txt(raw.redes?.facebook, 200),
    ...(saveOptions ? { "opciones/envio": options.envio, "opciones/transferencia": options.transferencia, "opciones/tarjeta": options.tarjeta } : {}),
  });
  afterSave(local);
}

export async function getHorarios(local) {
  const snap = await get(ref(getDb(), `locales/${local}/horarios`));
  return snap.val() || {};
}

export function cleanHorarios(raw) {
  const out = {};
  for (const k of WEEK_ORDER) {
    const d = raw?.[k] || {};
    const franjas = (d.franjas || [])
      .filter((f) => isHHMM(f.desde) && isHHMM(f.hasta) && f.desde !== f.hasta)
      .slice(0, MAX_FRANJAS)
      .map((f) => ({ desde: f.desde, hasta: f.hasta }));
    out[k] = { cerrado: Boolean(d.cerrado) || franjas.length === 0, franjas };
  }
  return out;
}

export async function saveHorarios(local, raw) {
  await set(ref(getDb(), `locales/${local}/horarios`), cleanHorarios(raw));
  afterSave(local);
}

export async function getVisitas(local) {
  const snap = await get(ref(getDb(), `locales/${local}/visitas`));
  return snap.val() || { total: 0, dias: {} };
}

async function syncSite(body) {
  const token = await idToken();
  if (!token) return;
  await fetch("/api/panel/sync", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

function afterSave(local, oldImage = "") {
  syncSite({ local, action: "revalidar" }).catch(() => {});
  if (oldImage) syncSite({ local, action: "cleanup", url: oldImage }).catch(() => {});
}

export function discardImage(local, url) {
  syncSite({ local, action: "cleanup", url }).catch(() => {});
}

/* ---------------- Administración (root) ---------------- */

export async function getMetricasSitio() {
  const token = await idToken();
  const res = await fetch("/api/panel/metricas", { headers: { authorization: `Bearer ${token || ""}` }, cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.code || "metricas");
  return body.data || {};
}

function cleanUrl(raw) {
  const value = txt(raw, 200).replace(/\/+$/, "");
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

export function cleanFicha(raw) {
  const url = cleanUrl(raw.url);
  const logo = txt(raw.logo, 2000);
  const portada = txt(raw.portada, 2000);
  return {
    nombre: txt(raw.nombre, 80),
    ciudad: txt(raw.ciudad, 80),
    rubro: txt(raw.rubro, 60),
    url,
    visible: Boolean(raw.visible) && Boolean(url),
    // La forma por defecto no se guarda: un local sin el campo se ve igual.
    ...(fotoFormaId(raw.fotoForma) !== DEFAULT_FOTO_FORMA ? { fotoForma: fotoFormaId(raw.fotoForma) } : {}),
    ...(/^https:\/\//i.test(logo) ? { logo } : {}),
    ...(portada === "logo" || /^https:\/\//i.test(portada) ? { portada } : {}),
  };
}

export async function listDirectorio() {
  const snap = await get(ref(getDb(), "directorio"));
  return snap.val() || {};
}

export async function listLocales() {
  const [localesSnap, directorio] = await Promise.all([get(ref(getDb(), "locales")), listDirectorio()]);
  const locales = localesSnap.val() || {};
  return Object.entries(locales)
    .filter(([, l]) => l?.datos || l?.comidas) // un nodo con solo visitas no es un local real
    .map(([slug, l]) => {
      const ficha = directorio[slug] || {};
      return {
        slug,
        nombre: ficha.nombre || l?.datos?.nombre || slug,
        ciudad: ficha.ciudad || "",
        rubro: ficha.rubro || "",
        url: ficha.url || "",
        logo: ficha.logo || "",
        portada: ficha.portada || "",
        fotoForma: fotoFormaId(ficha.fotoForma),
        visible: ficha.visible === true,
        productos: Object.keys(l?.comidas || {}).length,
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** La transacción garantiza que dos altas simultáneas no pisen el mismo nodo. */
export async function createLocal(raw) {
  const slug = txt(raw.slug, 40).toLowerCase();
  const invalid = slugError(slug);
  if (invalid) throw new Error(invalid);
  const ficha = cleanFicha(raw);
  if (!ficha.nombre) throw new Error("Falta el nombre del local.");
  const db = getDb();
  const result = await runTransaction(ref(db, `locales/${slug}/datos`), (current) => (current === null ? { nombre: ficha.nombre } : undefined));
  if (!result.committed) throw new Error("Ya existe un local con ese slug.");
  await set(ref(db, `directorio/${slug}`), ficha);
  return { slug, ...ficha };
}

export async function saveFicha(slug, raw) {
  const ficha = cleanFicha(raw);
  if (!ficha.nombre) throw new Error("Falta el nombre del local.");
  await set(ref(getDb(), `directorio/${slug}`), ficha);
}

/** Un local en false está revocado: no se reactiva al guardar. */
const activeLocales = (locales) => Object.entries(locales || {}).filter(([, v]) => v === true).map(([k]) => k);

export async function listUsuarios() {
  const snap = await get(ref(getDb(), "usuarios"));
  return Object.entries(snap.val() || {}).map(([uid, u]) => ({
    uid,
    nombre: u?.nombre || "",
    email: u?.email || "",
    superadmin: u?.superadmin === true,
    locales: activeLocales(u?.locales),
  }));
}

export async function saveUsuario(uid, { nombre, email, superadmin, locales }) {
  const assigned = {};
  for (const slug of locales || []) if (SLUG_RE.test(slug)) assigned[slug] = true;
  await set(ref(getDb(), `usuarios/${uid}`), {
    nombre: txt(nombre, 80),
    email: txt(email, 120),
    superadmin: Boolean(superadmin),
    ...(Object.keys(assigned).length ? { locales: assigned } : {}),
  });
}

/** Cambia el email de ingreso. El servidor comprueba que quien lo pide sea root. */
export async function changeUsuarioEmail(uid, email) {
  const token = await idToken();
  const res = await fetch("/api/panel/usuarios/email", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token || ""}` },
    body: JSON.stringify({ uid, email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw Object.assign(new Error(data.code || "admin/failed"), { code: data.code || "admin/failed" });
  return data.email;
}

/** Usa una segunda instancia de Auth para no cerrar la sesión del superadmin. */
export async function createUsuario({ email, password, nombre, locales = [], sendReset = false }) {
  const secondary = initializeApp(firebaseConfig, `alta-${Date.now()}`);
  try {
    const auth = getAuth(secondary);
    await setPersistence(auth, inMemoryPersistence);
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await saveUsuario(cred.user.uid, { nombre, email: email.trim(), superadmin: false, locales });
    await signOut(auth);
    if (sendReset) await sendPasswordResetEmail(getAuthClient(), email.trim()).catch(() => {});
    return cred.user.uid;
  } finally {
    await deleteApp(secondary).catch(() => {});
  }
}

export async function listSolicitudes() {
  const snap = await get(ref(getDb(), "solicitudes"));
  return Object.entries(snap.val() || {})
    .map(([uid, s]) => ({ uid, email: s?.email || "", nombre: s?.nombre || "", fecha: s?.fecha || 0 }))
    .sort((a, b) => b.fecha - a.fecha);
}

export async function resolveSolicitud(sol, locales) {
  if (locales.length) {
    const prev = await get(ref(getDb(), `usuarios/${sol.uid}`));
    const p = prev.val() || {};
    const merged = Array.from(new Set([...activeLocales(p.locales), ...locales]));
    await saveUsuario(sol.uid, { nombre: p.nombre || sol.nombre, email: p.email || sol.email, superadmin: p.superadmin === true, locales: merged });
  }
  await remove(ref(getDb(), `solicitudes/${sol.uid}`));
}
