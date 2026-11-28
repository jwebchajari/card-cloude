import { getTodosLosLocales } from "@/lib/directorio";
import { FAQS } from "@/lib/seo";
import { CONTACT, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { RUBROS, SOLUCIONES } from "@/lib/soluciones";

// Resumen del sitio para asistentes de IA (formato llms.txt). Solo usa datos reales del sitio.
export async function GET() {
  const locales = await getTodosLosLocales();
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `${SITE_NAME} es un menú digital y catálogo online para comercios de Argentina. Cada local tiene su carta con link propio y código QR. El cliente arma el pedido desde el celular, sin instalar aplicaciones, y el pedido llega completo al WhatsApp del local, sin intermediarios. El local cambia precios, fotos y horarios desde su panel.`,
    "",
    `Sirve para: ${RUBROS.join(", ")}.`,
    "",
    "## Soluciones",
    "",
    ...SOLUCIONES.map((x) => `- [${x.label}](${SITE_URL}/${x.slug}): ${x.description}`),
    "",
    "## Preguntas frecuentes",
    "",
    ...[...FAQS, ...SOLUCIONES.flatMap((x) => x.faqs)].map(([q, a]) => `- ${q} ${a}`),
  ];
  if (locales.length) {
    lines.push("", "## Locales adheridos", "", ...locales.map((l) => `- [${l.nombre}](${SITE_URL}/locales/${l.slug})${[l.rubro, l.ciudad].filter(Boolean).length ? `: ${[l.rubro, l.ciudad].filter(Boolean).join(", ")}` : ""}`));
  }
  lines.push("", "## Contacto", "", `- Sitio: ${SITE_URL}`, `- [Todos los locales](${SITE_URL}/locales)`);
  if (CONTACT.whatsappUrl) lines.push(`- [WhatsApp](${CONTACT.whatsappUrl})`);
  if (CONTACT.email) lines.push(`- Email: ${CONTACT.email}`);

  return new Response(`${lines.join("\n")}\n`, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
