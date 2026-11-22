import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest() {
  return {
    name: `${SITE_NAME}: carta digital con pedidos por WhatsApp`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "es-AR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b0a08",
    theme_color: "#0b0a08",
    categories: ["food", "business"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
