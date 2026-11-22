import { getTodosLosLocales } from "@/lib/directorio";
import { SITE_URL } from "@/lib/site";
import { SOLUCIONES } from "@/lib/soluciones";

export default async function sitemap() {
  const locales = await getTodosLosLocales();
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1, images: [`${SITE_URL}/opengraph-image.png`] },
    ...SOLUCIONES.map((x) => ({ url: `${SITE_URL}/${x.slug}`, changeFrequency: "monthly", priority: 0.9 })),
    { url: `${SITE_URL}/locales`, changeFrequency: "daily", priority: 0.8 },
    ...locales.map((l) => ({ url: `${SITE_URL}/locales/${l.slug}`, changeFrequency: "weekly", priority: 0.7, ...(l.portada ? { images: [l.portada.replace(/&/g, "&amp;")] } : {}) })),
  ];
}
