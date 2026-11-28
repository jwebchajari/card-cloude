// Dominio principal: cardcloude.com redirige a www en Vercel.
const PRODUCTION_URL = "https://www.cardcloude.com";

function resolveSiteUrl() {
  // Producción y previews apuntan al dominio real para no indexar direcciones .vercel.app.
  if (process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV) return PRODUCTION_URL;
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
}

export const SITE_URL = resolveSiteUrl().replace(/\/+$/, "");
export const SITE_NAME = "CardCloude";
export const SITE_DESCRIPTION = "Menú digital, catálogo online y menú QR para tu comercio. Tus clientes arman el pedido en el celular y te llega por WhatsApp, sin apps ni intermediarios.";

const whatsapp = (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "").replace(/\D/g, "");
const email = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || "").trim();

export const CONTACT = {
  email,
  whatsapp,
  whatsappUrl: whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola, quiero sumar mi local a CardCloude.")}` : "",
};

// Fecha de la última revisión del contenido fijo (inicio y soluciones). Actualizarla al cambiar esos textos.
export const CONTENT_UPDATED = "2026-11-28";
