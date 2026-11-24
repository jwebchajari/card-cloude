import { categoryLabel, waNumber } from "./catalogo";
import { cldUrl } from "./cloudinary-url";
import { VIDEO } from "./home-media";
import { CONTACT, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";
import { openingHoursSpec } from "@/utils/horarios";

export const SEO_TITLE = "Menú digital y catálogo con pedidos por WhatsApp";
const DEFAULT_IMAGE = { url: "/opengraph-image.png", width: 1200, height: 630, alt: "CardCloude: carta digital con pedidos directo a WhatsApp" };
const ORG_ID = `${SITE_URL}/#organization`;

export const FAQS = [
  ["¿Qué es CardCloude?", "Es un menú digital y catálogo online para comercios gastronómicos y locales. Tus clientes ven tus productos desde el celular, arman el pedido y te lo envían completo por WhatsApp."],
  ["¿Mis clientes tienen que descargar una aplicación?", "No. La carta se abre desde un link en el navegador del celular. Podés compartirlo por Instagram, WhatsApp o con un QR en el mostrador."],
  ["¿Cómo recibo los pedidos?", "Te llegan a tu WhatsApp con los productos, la forma de entrega y el medio de pago elegidos por el cliente, sin intermediarios."],
  ["¿Cuánto cuesta CardCloude?", "El precio puede variar. Escribinos por WhatsApp y te pasamos el valor actualizado para tu local."],
];

/** Metadatos completos de una página pública. */
export function pageMeta({ title, description, path, image = null }) {
  const images = [image ? { url: image, width: 1200, height: 630, alt: title } : DEFAULT_IMAGE];
  const full = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", locale: "es_AR", url: path, siteName: SITE_NAME, title: full, description, images },
    twitter: { card: "summary_large_image", title: full, description, images: images.map((i) => i.url) },
  };
}

export function shareImage(url) {
  return url ? cldUrl(url, "f_jpg,q_auto,c_fill,g_auto,w_1200,h_630") : null;
}

const faqNode = (faqs, id) => ({
  "@type": "FAQPage",
  "@id": id,
  mainEntity: faqs.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })),
});

export function breadcrumbNode(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE_URL}${path}` })),
  };
}

export function homeJsonLd(locales) {
  const graph = [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png`, width: 512, height: 512 },
      description: SITE_DESCRIPTION,
      ...(CONTACT.email ? { email: CONTACT.email } : {}),
    },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, inLanguage: "es-AR", publisher: { "@id": ORG_ID } },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service`,
      name: "Menú digital y catálogo online con pedidos por WhatsApp",
      serviceType: "Menú digital, catálogo online y menú QR para comercios",
      description: SITE_DESCRIPTION,
      provider: { "@id": ORG_ID },
      areaServed: { "@type": "Country", name: "Argentina" },
      url: SITE_URL,
    },
    {
      "@type": "VideoObject",
      "@id": `${SITE_URL}/#video`,
      name: VIDEO.name,
      description: VIDEO.description,
      thumbnailUrl: VIDEO.poster,
      contentUrl: VIDEO.src,
      uploadDate: VIDEO.uploadDate,
      duration: VIDEO.duration,
      inLanguage: "es-AR",
      publisher: { "@id": ORG_ID },
    },
    faqNode(FAQS, `${SITE_URL}/#faq`),
  ];
  if (locales.length) {
    graph.push({
      "@type": "ItemList",
      "@id": `${SITE_URL}/#locales`,
      name: "Locales adheridos a CardCloude",
      itemListElement: locales.map((l, i) => ({ "@type": "ListItem", position: i + 1, name: l.nombre, url: `${SITE_URL}/locales/${l.slug}` })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function solucionJsonLd(x) {
  const url = `${SITE_URL}/${x.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: x.title,
        serviceType: x.label,
        description: x.description,
        url,
        provider: { "@type": "Organization", "@id": ORG_ID, name: SITE_NAME, url: SITE_URL },
        areaServed: { "@type": "Country", name: "Argentina" },
      },
      faqNode(x.faqs, `${url}#faq`),
      breadcrumbNode([["Inicio", "/"], [x.label, `/${x.slug}`]]),
    ],
  };
}

export function directorioJsonLd(locales) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Locales con menú digital y catálogo online",
        url: `${SITE_URL}/locales`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: locales.length,
          itemListElement: locales.map((l, i) => ({ "@type": "ListItem", position: i + 1, name: l.nombre, url: `${SITE_URL}/locales/${l.slug}` })),
        },
      },
      breadcrumbNode([["Inicio", "/"], ["Locales", "/locales"]]),
    ],
  };
}

function businessType(rubro) {
  const r = String(rubro || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/verdul|fruter|almacen|supermerc/.test(r)) return "GroceryStore";
  if (/hambur|pizz|rotis|restaur|sandw|empan|parrill|comida|sushi/.test(r)) return "Restaurant";
  if (/bar\b|cervec/.test(r)) return "BarOrPub";
  if (/cafe/.test(r)) return "CafeOrCoffeeShop";
  if (/helad/.test(r)) return "IceCreamShop";
  if (/panad/.test(r)) return "Bakery";
  return "LocalBusiness";
}

export function localJsonLd(l) {
  const url = `${SITE_URL}/locales/${l.slug}`;
  const type = businessType(l.rubro);
  const phone = waNumber(l.datos.whatsapp);
  const image = l.portada || l.logo;
  const hours = openingHoursSpec(l.horarios);
  const foodType = ["Restaurant", "BarOrPub", "CafeOrCoffeeShop", "IceCreamShop", "Bakery"].includes(type);
  const business = {
    "@type": type,
    "@id": `${url}#business`,
    name: l.nombre,
    url: l.url,
    mainEntityOfPage: url,
    description: `${l.nombre}${l.rubro ? `, ${l.rubro.toLowerCase()}` : ""}${l.ciudad ? ` en ${l.ciudad}` : ""}. Carta online con pedidos por WhatsApp.`,
    address: {
      "@type": "PostalAddress",
      ...(l.datos.direccion ? { streetAddress: l.datos.direccion } : {}),
      ...(l.ciudad ? { addressLocality: l.ciudad.split(",")[0].trim() } : {}),
      addressCountry: "AR",
    },
  };
  if (image) business.image = image;
  if (phone.length > 3) business.telephone = `+${phone}`;
  if (hours.length) business.openingHoursSpecification = hours;
  if (foodType) {
    business.hasMenu = l.url;
    if (l.rubro) business.servesCuisine = l.rubro;
  }
  const categories = [...new Set(l.productos.map((p) => categoryLabel(p.categoria)))];
  if (categories.length) business.knowsAbout = categories;
  return {
    "@context": "https://schema.org",
    "@graph": [business, breadcrumbNode([["Inicio", "/"], ["Locales", "/locales"], [l.nombre, `/locales/${l.slug}`]])],
  };
}
