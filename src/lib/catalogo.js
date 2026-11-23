// Catálogo común a todos los locales del panel central. Sin marca ni ciudad de un cliente.
export const TIMEZONE = "America/Argentina/Buenos_Aires";
export const SITE_AREA_CODE = "3456"; // solo para la vista previa del link de WhatsApp
export const CLOUDINARY_ROOT = "CardCloude";

export const CATEGORIES = [
  { id: "hamburguesas", label: "Hamburguesas" },
  { id: "sandwich", label: "Sandwiches" },
  { id: "papas", label: "Papas" },
  { id: "frutas", label: "Frutas" },
  { id: "verduras", label: "Verduras" },
  { id: "bebidas", label: "Bebidas" },
  { id: "otros", label: "Otros" },
];

/** Solo estas categorías ofrecen elegir cantidad de carnes. */
export function usesMeats(categoria) {
  return !["bebidas", "frutas", "verduras"].includes(categoria);
}

export const CATEGORY_ALIASES = {
  hamburguesa: "hamburguesas",
  burger: "hamburguesas",
  burgers: "hamburguesas",
  papa: "papas",
  fritas: "papas",
  "papas fritas": "papas",
  acompanamientos: "papas",
  bebida: "bebidas",
  gaseosa: "bebidas",
  gaseosas: "bebidas",
  cerveza: "bebidas",
  cervezas: "bebidas",
  tragos: "bebidas",
};

export function slugText(raw) {
  return String(raw ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export const MAX_CATEGORY_NAME = 40;

function cleanCategoryName(raw) {
  return String(raw ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_CATEGORY_NAME);
}

/** Categoría común si coincide con una. Si no, el nombre que escribió el dueño. Vacío cae en "otros". */
export function categoryOf(raw) {
  const name = cleanCategoryName(raw);
  if (!name) return "otros";
  const s = slugText(name);
  const common = CATEGORIES.find((c) => c.id === s || slugText(c.label) === s);
  return common?.id || CATEGORY_ALIASES[s] || name;
}

export function isCommonCategory(id) {
  return CATEGORIES.some((c) => c.id === id);
}

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || cleanCategoryName(id) || "Otros";
}

/** Orden en la carta: las propias del local van antes de la última categoría común. */
export function categoryRank(id) {
  const i = CATEGORIES.findIndex((c) => c.id === id);
  return i >= 0 ? i : CATEGORIES.length - 1.5;
}

/** Identificador seguro para anclas y atributos HTML. */
export function categoryAnchor(id) {
  return slugText(id).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "otra";
}

/** Categorías propias sin repetidos (ignora mayúsculas y acentos), en orden alfabético. */
export function customCategories(list) {
  const seen = new Map();
  for (const item of list) {
    const name = cleanCategoryName(item);
    const key = slugText(name);
    if (name && !seen.has(key) && !isCommonCategory(categoryOf(name))) seen.set(key, name);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "es"));
}

export const MIN_MEATS = 1;
export const MAX_MEATS = 4;
export const MAX_BASE_MEATS = MAX_MEATS - 1;
export const MEAT_LABELS = { 1: "Simple", 2: "Doble", 3: "Triple", 4: "Cuádruple" };
// Recargo sobre el precio de 1 carne, para productos sin precio propio en `precios`.
export const MEAT_SURCHARGE = { 1: 0, 2: 3000, 3: 5000, 4: 7000 };
// Claves de `precios` en la base. Con texto y no números para que Firebase no lo convierta en array.
export const MEAT_PRICE_KEYS = { 2: "doble", 3: "triple", 4: "cuadruple" };

export const INGREDIENT_GROUPS = [
  { id: "pan", label: "Pan" },
  { id: "carne", label: "Carne" },
  { id: "aderezos", label: "Aderezos y agregados" },
];

export const INGREDIENT_CATALOG = {
  pan: ["Pan brioche", "Pan brioche especial"],
  carne: ["Carne 100% tapa de asado"],
  aderezos: [
    "Bacon",
    "BBQ",
    "Cebolla",
    "Cebolla crispy",
    "Cebolla morada",
    "Cheddar",
    "El mix de 1000 granos",
    "Huevo",
    "Lechuga",
    "Lechuga repollada",
    "Mayonesa de chimichurri",
    "Mostaza",
    "Panceta",
    "Panceta crocante",
    "Pepinillos",
    "Salsa especial",
    "Salsa Staker",
    "Tomate",
  ],
};

const MAX_INGREDIENT_NAME = 40;
const MAX_INGREDIENTS_PER_GROUP = 30;
const ingredientCollator = new Intl.Collator("es", { sensitivity: "base" });

export function ingredientKey(name) {
  return slugText(name).replace(/\s+/g, " ");
}

/** Lista sin repetidos (ignora mayúsculas y acentos) y en orden alfabético. */
export function sortIngredientNames(list) {
  const seen = new Map();
  for (const item of Array.isArray(list) ? list : Object.values(list || {})) {
    const name = String(item ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_INGREDIENT_NAME);
    const key = ingredientKey(name);
    if (key && !seen.has(key)) seen.set(key, name);
  }
  return [...seen.values()].sort(ingredientCollator.compare);
}

export function cleanIngredients(raw) {
  const out = {};
  for (const { id } of INGREDIENT_GROUPS) out[id] = sortIngredientNames(raw?.[id]).slice(0, MAX_INGREDIENTS_PER_GROUP);
  return out;
}

export function hasIngredients(raw) {
  const clean = cleanIngredients(raw);
  return INGREDIENT_GROUPS.some(({ id }) => clean[id].length > 0);
}

/** Texto para la carta: pan, carne y después aderezos en orden alfabético. */
export function ingredientsText(raw) {
  const clean = cleanIngredients(raw);
  const names = INGREDIENT_GROUPS.flatMap(({ id }) => clean[id]);
  return names.length ? `${names.join(", ")}.` : "";
}

export const SHIPPING_ZONES = [
  { id: "ciudad", label: "Dentro de la ciudad", field: "costoEnvio" },
  { id: "fuera", label: "Fuera de la ciudad", field: "costoEnvioFuera" },
];

export function fullAddress(dir) {
  return String(dir ?? "").trim();
}

/* ---------------- Venta por cantidad ---------------- */

export const MAX_PACKS = 8;
export const MAX_PACK_QTY = 999;

export function packKey(cantidad) {
  return `x${cantidad}`;
}

export function packUnits(cantidad) {
  return cantidad === 1 ? "1 unidad" : `${cantidad} unidades`;
}

/** Deja solo presentaciones válidas, de menor a mayor cantidad: { x1: 3000, x6: 15000 }. */
export function cleanPacks(raw) {
  if (!raw || typeof raw !== "object") return {};
  const valid = Object.entries(raw)
    .map(([key, value]) => ({ cantidad: Number(/^x([1-9]\d{0,2})$/.exec(key)?.[1]), precio: Math.round(Number(value)) }))
    .filter((p) => p.cantidad > 0 && p.precio > 0 && p.precio <= 100000000)
    .sort((a, b) => a.cantidad - b.cantidad)
    .slice(0, MAX_PACKS);
  return Object.fromEntries(valid.map((p) => [packKey(p.cantidad), p.precio]));
}

export function productPacks(product) {
  return Object.entries(cleanPacks(product?.presentaciones)).map(([key, precio]) => ({ key, cantidad: Number(key.slice(1)), precio }));
}

/** La presentación elegida. Si ya no existe, la primera: el carrito la muestra y se puede cambiar. */
export function resolvePack(product, key) {
  const packs = productPacks(product);
  return packs.find((p) => p.key === key) || packs[0] || null;
}

/** Precio en una línea para vistas previas, metadata y tarjetas. */
export function priceText(product) {
  const packs = productPacks(product);
  if (!packs.length) return formatPrice(unitPrice(product));
  if (packs.length === 1) return `${packs[0].key} ${formatPrice(packs[0].precio)}`;
  return `Desde ${formatPrice(Math.min(...packs.map((p) => p.precio)))}`;
}

export function hasOffer(p) {
  if (productPacks(p).length) return false;
  const v = Number(p?.valor);
  const o = Number(p?.valorOferta);
  return Boolean(p?.oferta) && o > 0 && o < v;
}

export function unitPrice(p) {
  const packs = productPacks(p);
  if (packs.length) return packs[0].precio;
  return hasOffer(p) ? Number(p.valorOferta) : Number(p?.valor) || 0;
}

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function formatPrice(n) {
  return ARS.format(Math.round(Number(n) || 0));
}

/** null/"" = "A confirmar", 0 = "Gratis". */
export function envioLabel(costo) {
  if (costo === null || costo === undefined || costo === "") return "A confirmar";
  const n = Number(costo);
  if (!Number.isFinite(n)) return "A confirmar";
  return n === 0 ? "Gratis" : formatPrice(n);
}

/**
 * Normaliza un teléfono argentino al formato de wa.me: 54 9 <área> <número>.
 * Acepta "03456 15-123456", "+54 9 3456 123456", "3456123456", "15123456", etc.
 */
export function waNumber(raw) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("54")) {
    d = d.slice(2);
    if (d.startsWith("9")) d = d.slice(1);
  }
  if (d.startsWith("0")) d = d.slice(1);
  // número local sin característica
  if (d.length === 8 && d.startsWith("15")) d = d.slice(2);
  if (d.length <= 7) d = SITE_AREA_CODE + d;
  // área + 15 + número (12 dígitos): sacar el 15
  if (d.length === 12) {
    for (const i of [4, 3, 2]) {
      if (d.slice(i, i + 2) === "15") {
        d = d.slice(0, i) + d.slice(i + 2);
        break;
      }
    }
  }
  return `549${d}`;
}

function handleFrom(raw, hosts) {
  let s = String(raw ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      if (hosts.some((h) => u.hostname.endsWith(h))) return u.pathname.split("/").filter(Boolean)[0] || "";
      return "";
    } catch {
      return "";
    }
  }
  s = s.replace(/^@/, "").split(/[/?#\s]/)[0];
  return s;
}

export function instagramUrl(raw) {
  const h = handleFrom(raw, ["instagram.com"]);
  return h ? `https://www.instagram.com/${encodeURIComponent(h)}/` : "";
}

export function facebookUrl(raw) {
  const h = handleFrom(raw, ["facebook.com", "fb.com"]);
  return h ? `https://www.facebook.com/${encodeURIComponent(h)}` : "";
}

export function meatLabel(n) {
  return MEAT_LABELS[n] || `${n} medallones`;
}
