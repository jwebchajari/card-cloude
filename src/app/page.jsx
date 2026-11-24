import Link from "next/link";
import { Check } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import LocalCard from "@/components/LocalCard";
import ContactSection from "@/components/site/ContactSection";
import SiteFooter from "@/components/site/SiteFooter";
import PanelCarousel from "@/components/site/PanelCarousel";
import SiteHeader from "@/components/site/SiteHeader";
import VideoSection from "@/components/site/VideoSection";
import { getDirectorio } from "@/lib/directorio";
import { FAQS, homeJsonLd } from "@/lib/seo";
import { CONTACT } from "@/lib/site";
import { SOLUCIONES } from "@/lib/soluciones";
import h from "@/components/site/home.module.css";
import s from "./landing.module.css";
import p from "./pages.module.css";

export const metadata = { alternates: { canonical: "/" } };

const STEPS = [
  ["Creamos tu carta", "Cargamos tu marca, tus productos, precios, fotos y horarios."],
  ["Compartís tu link", "Lo ponés en Instagram, WhatsApp o en un QR en el mostrador."],
  ["Recibís el pedido", "El cliente elige, y el pedido te llega armado por WhatsApp."],
];

const CONTACT_POINTS = [
  "Listo para cargar tus productos en 2 días o menos",
  "Consultá el precio por WhatsApp",
  "Tus clientes pueden instalar la app de tu local",
];

const FEATURES = [
  "Carta pensada para el celular",
  "Estado abierto o cerrado según tus horarios",
  "Envío a domicilio o retiro en el local",
  "Pago en efectivo, transferencia o tarjeta",
  "Panel propio para cambiar precios y fotos",
  "Productos con link para compartir",
];

export default async function Home() {
  const { locales, total } = await getDirectorio();
  const priceUrl = CONTACT.whatsapp
    ? `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent("Hola, quiero consultar el precio de CardCloude para mi local.")}`
    : "#contacto";

  return (
    <>
      <JsonLd data={homeJsonLd(locales)} />
      <SiteHeader />

      <main>
        <section className={s.hero}>
          <div>
            <h1>Tu carta online. Los pedidos, directo a tu <em>WhatsApp.</em></h1>
            <p>CardCloude le da a tu comercio un menú digital propio que tus clientes abren desde el celular, sin aplicaciones y sin intermediarios.</p>
            <div className={s.heroActions}>
              <a href="#contacto" className="btn btn-primary">
                Quiero sumar mi local
              </a>
              <a href="#como-funciona" className="btn">
                Ver cómo funciona
              </a>
            </div>
          </div>
          <div className={s.ticket} role="img" aria-label="Ejemplo de ticket de un pedido por WhatsApp, con cliente, productos, entrega, pago y total a abonar">
            <div className={s.ticketPaper}>
              <span className={s.ticketTag}>Pedido de ejemplo</span>
              <strong>Nuevo pedido</strong>
              <dl className={s.ticketRows}>
                <div>
                  <dt>Cliente</dt>
                  <dd>Nombre del cliente</dd>
                </div>
              </dl>
              <div className={s.ticketItems}>
                <span>Productos</span>
                <ul>
                  <li>
                    <span>2 x Producto de la carta</span>
                    <b>$ 0.000</b>
                  </li>
                  <li>
                    <span>1 x Otro producto</span>
                    <b>$ 0.000</b>
                  </li>
                </ul>
              </div>
              <dl className={s.ticketRows}>
                <div>
                  <dt>Entrega</dt>
                  <dd>Retiro en el local</dd>
                </div>
                <div>
                  <dt>Pago</dt>
                  <dd>Transferencia</dd>
                </div>
              </dl>
              <p className={s.ticketTotal}>
                <span>Total a abonar</span>
                <b>$ 0.000</b>
              </p>
              <small>Enviado por WhatsApp</small>
            </div>
          </div>
        </section>

        <section id="como-funciona" className={s.section}>
          <h2>Cómo funciona</h2>
          <ol className={s.steps}>
            {STEPS.map(([title, text], i) => (
              <li key={title}>
                <span>{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <VideoSection cta={priceUrl} />

        <section id="panel" className={`${s.section} ${h.panelSection}`}>
          <div>
            <h2>Manejá todo desde tu celular</h2>
            <ul className={h.features}>
              {FEATURES.map((feature) => (
                <li key={feature}>
                  <Check size={18} aria-hidden /> {feature}
                </li>
              ))}
            </ul>
          </div>
          <PanelCarousel />
        </section>

        <section className={s.section}>
          <h2>Una solución para cada forma de vender</h2>
          <ul className={p.solutions}>
            {SOLUCIONES.map((x) => (
              <li key={x.slug}>
                <Link href={`/${x.slug}`}><strong>{x.label}</strong><span>{x.short}</span></Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="locales" className={s.section}>
          <div className={s.sectionHead}>
            <h2>Locales adheridos</h2>
            {total > locales.length ? <p>Mostrando {locales.length} de {total} locales. La selección cambia cada día.</p> : null}
          </div>
          {locales.length ? (
            <ul className={s.locales}>
              {locales.map((l) => <LocalCard key={l.slug} local={l} />)}
            </ul>
          ) : (
            <p className="hint">Pronto vas a ver acá los locales que ya usan CardCloude.</p>
          )}
          {locales.length ? <Link href="/locales" className={`btn ${p.more}`} style={{ display: "flex", width: "fit-content", marginInline: "auto" }}>Ver todos los locales</Link> : null}
        </section>

        <section id="preguntas" className={s.section}>
          <h2>Preguntas frecuentes</h2>
          <div className={s.faq}>
            {FAQS.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <ContactSection points={CONTACT_POINTS} />
      </main>

      <SiteFooter />
    </>
  );
}
