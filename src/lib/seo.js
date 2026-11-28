import { categoryLabel, facebookUrl, instagramUrl, productPacks, unitPrice, waNumber } from "./catalogo";
import { groupByCategory } from "./menu-shared";
import { cldUrl } from "./cloudinary-url";
import { VIDEO } from "./home-media";
import { CONTACT, SAME_AS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";
import { SOLUCIONES } from "./soluciones";
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
      areaServed: { "@type": "Country", name: "Argentina" },
      knowsAbout: SOLUCIONES.map((x) => x.label),
      ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
      ...(CONTACT.email ? { email: CONTACT.email } : {}),
      ...(CONTACT.whatsapp || CONTACT.email
        ? {
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "sales",
              availableLanguage: "es",
              areaServed: "AR",
              ...(CONTACT.whatsapp ? { telephone: `+${CONTACT.whatsapp}`, url: CONTACT.whatsappUrl } : {}),
              ...(CONTACT.email ? { email: CONTACT.email } : {}),
            },
          }
        : {}),
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
  if (/churr|confit|comida|delivery/.test(r)) return "FoodEstablishment";
  return "LocalBusiness";
}

const FOOD_TYPES = ["Restaurant", "BarOrPub", "CafeOrCoffeeShop", "IceCreamShop", "Bakery", "FoodEstablishment"];

// servesCuisine espera un tipo de comida, no el rubro del local.
const CUISINES = [
  [/hambur/, "Hamburguesas"],
  [/pizz/, "Pizza"],
  [/empan/, "Empanadas"],
  [/sushi/, "Sushi"],
  [/parrill/, "Parrilla"],
  [/sandw/, "Sándwiches"],
  [/churr/, "Churros"],
  [/helad/, "Helados"],
  [/cafe/, "Café"],
  [/panad/, "Panadería"],
];

const plainText = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function cuisineOf(rubro) {
  const r = plainText(rubro);
  return CUISINES.find(([re]) => re.test(r))?.[1] || "";
}

const MAX_MENU_ITEMS = 100;

function offerOf(p) {
  const packs = productPacks(p);
  if (packs.length > 1) {
    const prices = packs.map((x) => x.precio).filter((n) => n > 0);
    if (!prices.length) return null;
    return { "@type": "AggregateOffer", priceCurrency: "ARS", lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: prices.length };
  }
  const price = unitPrice(p);
  return price > 0 ? { "@type": "Offer", priceCurrency: "ARS", price } : null;
}

function itemOf(p, type, withOffer = true) {
  const offers = withOffer ? offerOf(p) : null;
  return {
    "@type": type,
    name: p.nombre,
    ...(p.descripcion ? { description: p.descripcion } : {}),
    ...(p.imagen ? { image: cldUrl(p.imagen, "f_jpg,q_auto,c_fill,w_800,h_800") } : {}),
    ...(offers ? { offers } : {}),
  };
}

/** Carta completa: Menu para gastronomía, OfferCatalog para el resto de los comercios. */
function catalogOf(l, food) {
  const groups = groupByCategory(l.productos.slice(0, MAX_MENU_ITEMS));
  if (!groups.length) return null;
  if (food) {
    return {
      "@type": "Menu",
      name: `Carta de ${l.nombre}`,
      url: l.url,
      inLanguage: "es-AR",
      hasMenuSection: groups.map((g) => ({ "@type": "MenuSection", name: g.label, hasMenuItem: g.items.map((p) => itemOf(p, "MenuItem")) })),
    };
  }
  return {
    "@type": "OfferCatalog",
    name: `Productos de ${l.nombre}`,
    url: l.url,
    itemListElement: groups.map((g) => ({
      "@type": "OfferCatalog",
      name: g.label,
      itemListElement: g.items.map((p) => ({ ...(offerOf(p) || { "@type": "Offer" }), itemOffered: itemOf(p, "Product", false) })),
    })),
  };
}

/** Saca la ciudad del final de la dirección cuando el dueño la escribió junto a la calle. */
function streetOf(direccion, city) {
  const d = String(direccion || "").trim().normalize("NFC");
  // Se compara letra por letra para que la posición coincida con el texto original.
  const i = city ? [...d].map(plainText).join("").lastIndexOf(plainText(city.normalize("NFC"))) : -1;
  return (i > 0 ? d.slice(0, i) : d).replace(/[\s,.-]+$/, "");
}

export function localJsonLd(l) {
  const url = `${SITE_URL}/locales/${l.slug}`;
  const type = businessType(l.rubro);
  const phone = waNumber(l.datos.whatsapp);
  const image = l.portada || l.logo;
  const hours = openingHoursSpec(l.horarios);
  const food = FOOD_TYPES.includes(type);
  const [city, region] = l.ciudad.split(",").map((x) => x.trim());
  const street = streetOf(l.datos.direccion, city);
  const sameAs = [instagramUrl(l.datos.redes.instagram), facebookUrl(l.datos.redes.facebook)].filter(Boolean);
  const business = {
    "@type": type,
    "@id": `${url}#business`,
    name: l.nombre,
    url: l.url,
    mainEntityOfPage: url,
    description: `${l.nombre}${l.rubro ? `, ${l.rubro.toLowerCase()}` : ""}${l.ciudad ? ` en ${l.ciudad}` : ""}. Carta online con pedidos por WhatsApp.`,
    address: {
      "@type": "PostalAddress",
      ...(street ? { streetAddress: street } : {}),
      ...(city ? { addressLocality: city } : {}),
      ...(region ? { addressRegion: region } : {}),
      addressCountry: "AR",
    },
  };
  // El nombre que el dueño cargó en su panel, si difiere del directorio, ayuda a unir ambas fichas.
  if (l.datos.nombre && plainText(l.datos.nombre) !== plainText(l.nombre)) business.alternateName = l.datos.nombre;
  if (sameAs.length) business.sameAs = sameAs;
  if (image) business.image = image;
  if (phone.length > 3) business.telephone = `+${phone}`;
  if (hours.length) business.openingHoursSpecification = hours;
  if (food) {
    const cuisine = cuisineOf(l.rubro);
    if (cuisine) business.servesCuisine = cuisine;
  }
  const catalog = catalogOf(l, food);
  if (catalog) business[food ? "hasMenu" : "hasOfferCatalog"] = catalog;
  else if (food) business.hasMenu = l.url;
  const categories = [...new Set(l.productos.map((p) => categoryLabel(p.categoria)))];
  if (categories.length) business.knowsAbout = categories;
  return {
    "@context": "https://schema.org",
    "@graph": [business, breadcrumbNode([["Inicio", "/"], ["Locales", "/locales"], [l.nombre, `/locales/${l.slug}`]])],
  };
}
