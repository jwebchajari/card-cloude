import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Clock, MapPin, MessageCircle } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import SafeImg from "@/components/SafeImg";
import ShareLocal from "@/components/ShareLocal";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import ContactSection from "@/components/site/ContactSection";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { formatPrice, hasOffer, priceText, waNumber } from "@/lib/catalogo";
import { cldUrl } from "@/lib/cloudinary-url";
import { getLocalPublico, getVisibles } from "@/lib/directorio";
import { localJsonLd, pageMeta, shareImage } from "@/lib/seo";
import { DAY_LABELS, WEEK_ORDER, franjasText, hasAnyHorario } from "@/utils/horarios";
import s from "../../pages.module.css";

const MAX_PRODUCTS = 12;

// La ficha espera sus datos antes de mostrarse, así el HTML llega completo y sin partes ocultas
// para buscadores y asistentes de IA que no ejecutan JavaScript. El 404 lo decide src/proxy.js.
export const instant = false;

export async function generateStaticParams() {
  const locales = await getVisibles();
  return locales.length ? locales.map((l) => ({ slug: l.slug })) : [{ slug: "sin-locales" }];
}

function place(l) {
  return [l.rubro, l.ciudad].filter(Boolean).join(" en ");
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const l = await getLocalPublico(slug);
  if (!l) return { title: "Local no encontrado", robots: { index: false, follow: false } };
  const where = l.ciudad ? ` en ${l.ciudad.split(",")[0].trim()}` : "";
  return pageMeta({
    title: `${l.nombre}${where}: carta online y pedidos`,
    description: `Mirá el menú de ${l.nombre}${l.rubro ? `, ${l.rubro.toLowerCase()}` : ""}${where}. Productos, precios y horarios, con pedidos directo por WhatsApp.`,
    path: `/locales/${l.slug}`,
    image: shareImage(l.portada),
  });
}

function highlights(productos) {
  const score = (p) => (hasOffer(p) ? 2 : 0) + (p.imagen ? 1 : 0);
  return [...productos].sort((a, b) => score(b) - score(a)).slice(0, MAX_PRODUCTS);
}

export default async function LocalPage({ params }) {
  const { slug } = await params;
  const l = await getLocalPublico(slug);
  if (!l) notFound();

  const logos = l.logo ? [cldUrl(l.logo, "f_auto,q_auto,c_fit,w_240,h_240")] : [`${l.url}/logo.png`, `${l.url}/logo-sm.webp`];
  const phone = waNumber(l.datos.whatsapp);
  const products = highlights(l.productos);
  const initials = l.nombre.slice(0, 2).toUpperCase();
  const plain = (v) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const city = l.ciudad.split(",")[0].trim();
  const address = city && !plain(l.datos.direccion).includes(plain(city)) ? `${l.datos.direccion}, ${l.ciudad}` : l.datos.direccion;

  return (
    <>
      <JsonLd data={localJsonLd(l)} />
      <SiteHeader />
      <main>
        <div className={s.wrap}>
          <Breadcrumbs items={[["Inicio", "/"], ["Locales", "/locales"], [l.nombre, `/locales/${l.slug}`]]} />
        </div>

        <section className={s.localHero}>
          <div className={s.localCover}>
            <SafeImg
              sources={[l.portada ? cldUrl(l.portada, "f_auto,q_auto,c_fill,w_960,h_720") : ""]}
              alt={`Foto de ${l.nombre}`}
              width={960}
              height={720}
              fetchPriority="high"
              fallback={<img className={s.coverMark} src="/brand/mark-white.svg" alt="" width={250} height={200} />}
            />
          </div>
          <div className={s.localIntro}>
            <span className={s.localLogo}>
              <SafeImg sources={logos} alt={`Logo de ${l.nombre}`} width={120} height={120} fallback={<b aria-hidden>{initials}</b>} />
            </span>
            <div>
              <h1>{l.nombre}</h1>
              {place(l) ? <p>{place(l)}</p> : null}
            </div>
            <div className={s.localActions}>
              <a href={l.url} target="_blank" rel="noopener" className="btn btn-primary">Ver carta y pedir <ArrowUpRight size={18} aria-hidden /></a>
              <ShareLocal nombre={l.nombre} url={l.url} className="btn" label="Compartir" />
            </div>
          </div>
        </section>

        <div className={s.localGrid}>
          <section aria-labelledby="productos">
            <h2 id="productos">{l.productos.length > products.length ? "Productos destacados" : "Productos"}</h2>
            {products.length ? (
              <ul className={s.products}>
                {products.map((p) => (
                  <li key={p.id}>
                    {p.imagen ? <SafeImg sources={[cldUrl(p.imagen, "f_auto,q_auto,c_fill,w_240,h_240")]} alt={p.nombre} width={104} height={104} loading="lazy" /> : null}
                    <div>
                      <h3>{p.nombre}</h3>
                      {p.descripcion ? <p>{p.descripcion}</p> : null}
                      <strong>{hasOffer(p) ? <del>{formatPrice(p.valor)}</del> : null} {priceText(p)}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="hint">Este local todavía no cargó productos.</p>}
            {l.productos.length > products.length ? <a href={l.url} target="_blank" rel="noopener" className={`btn ${s.more}`}>Ver los {l.productos.length} productos</a> : null}
          </section>

          <aside className={s.localInfo}>
            <h2>Información</h2>
            {l.datos.direccion ? <p><MapPin size={18} aria-hidden /> {address}</p> : null}
            {phone.length > 3 ? <p><MessageCircle size={18} aria-hidden /> <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer nofollow">Escribir por WhatsApp</a></p> : null}
            {hasAnyHorario(l.horarios) ? (
              <div>
                <h3><Clock size={18} aria-hidden /> Horarios</h3>
                <dl>
                  {WEEK_ORDER.map((d) => (
                    <div key={d}><dt>{DAY_LABELS[d]}</dt><dd>{franjasText(l.horarios[d])}</dd></div>
                  ))}
                </dl>
              </div>
            ) : null}
          </aside>
        </div>

        {l.otros.length ? (
          <section className={s.wrapSection}>
            <h2>Otros locales</h2>
            <ul className={s.solutions}>
              {l.otros.map((o) => (
                <li key={o.slug}><Link href={`/locales/${o.slug}`}><strong>{o.nombre}</strong><span>{place(o)}</span></Link></li>
              ))}
            </ul>
          </section>
        ) : null}

        <ContactSection title="¿Querés una carta como esta?" />
      </main>
      <SiteFooter />
    </>
  );
}
