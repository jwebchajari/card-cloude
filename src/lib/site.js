function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || "";
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(explicit);
  if (explicit && !(isLocal && vercel)) return explicit;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3001";
}

export const SITE_URL = resolveSiteUrl().replace(/\/+$/, "");
export const SITE_NAME = "CardCloude";
export const SITE_DESCRIPTION = "Carta online para comercios locales: tus clientes arman el pedido y te llega completo por WhatsApp.";

const whatsapp = (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "").replace(/\D/g, "");
const email = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || "").trim();

export const CONTACT = {
  email,
  whatsapp,
  whatsappUrl: whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola, quiero sumar mi local a CardCloude.")}` : "",
};
