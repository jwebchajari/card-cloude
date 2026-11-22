// Única definición de qué es un slug válido. Las reglas de la base aplican el mismo formato.
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$/;
export const RESERVED_SLUGS = ["admin", "api", "dashboard", "login", "nuevo", "panel", "www"];

export function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

export function slugError(slug) {
  if (!SLUG_RE.test(slug)) return "Usá de 2 a 40 letras o números, separados por guiones.";
  if (RESERVED_SLUGS.includes(slug)) return "Ese nombre está reservado.";
  return "";
}

function distance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return row[b.length];
}

/** Locales con un nombre tan parecido que probablemente sean un error de tipeo. */
export function similarSlugs(slug, existing) {
  const compact = (v) => v.replace(/-/g, "");
  const target = compact(slug);
  if (target.length < 3) return [];
  return existing.filter((other) => {
    const value = compact(other);
    if (other === slug) return false;
    return value === target || value.includes(target) || target.includes(value) || distance(value, target) <= 2;
  });
}
