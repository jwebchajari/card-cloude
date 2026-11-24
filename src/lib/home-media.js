// Video de la portada, alojado en Cloudinary.
const BASE = "https://res.cloudinary.com/nusfx2nl/video/upload";
const FILE = "v1795481426/CardCloude/_home/reel-cardcloude";

export const VIDEO = {
  name: "Cómo funciona CardCloude",
  description: "Video de 28 segundos: un cliente abre la carta, arma el pedido por WhatsApp e instala la app del local.",
  src: `${BASE}/q_auto:best/${FILE}.mp4`,
  poster: `${BASE}/so_12,f_jpg,q_auto,w_720/${FILE}.jpg`,
  uploadDate: "2026-11-23",
  duration: "PT28S",
};
