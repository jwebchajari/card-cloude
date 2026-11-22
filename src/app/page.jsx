import Link from "next/link";
import { Check, Mail, MessageCircle } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import LocalCard from "@/components/LocalCard";
import { getDirectorio } from "@/lib/directorio";
import { CONTACT } from "@/lib/site";
import s from "./landing.module.css";

const STEPS = [
  ["Creamos tu carta", "Cargamos tu marca, tus productos, precios, fotos y horarios."],
  ["Compartís tu link", "Lo ponés en Instagram, WhatsApp o en un QR en el mostrador."],
  ["Recibís el pedido", "El cliente elige, y el pedido te llega armado por WhatsApp."],
];

const FEATURES = [
  "Carta pensada para el celular",
  "Estado abierto o cerrado según tus horarios",
  "Envío a domicilio o retiro en el local",
  "Pago en efectivo o transferencia, con tu alias",
  "Panel propio para cambiar precios y fotos",
  "Productos con link para compartir",
];

const CONTACT_POINTS = ["Sin aplicaciones para tus clientes", "Sin intermediarios en tus pedidos", "Vos cambiás precios y fotos desde tu panel"];

function Brand() {
  return (
    <Link href="/" className={s.logo}>
      <img src="/logo-mark.webp" alt="" width={34} height={36} />
      CardCloude
    </Link>
  );
}

export default async function Home() {
  const { locales, total } = await getDirectorio();
  const hasContact = CONTACT.whatsapp || CONTACT.email;

  return (
    <>
      <header className={s.header}>
        <Brand />
        <nav className={s.nav} aria-label="Principal">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#locales">Locales</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <Link href="/login" className="btn">
          Ingresar
        </Link>
      </header>

      <main>
        <section className={s.hero}>
          <div>
            <h1>Tu carta online. Los pedidos, directo a tu <em>WhatsApp.</em></h1>
            <p>CardCloude le da a tu comercio una carta propia que tus clientes abren desde el celular, sin aplicaciones y sin intermediarios.</p>
            <div className={s.heroActions}>
              <a href="#contacto" className="btn btn-primary">
                Quiero sumar mi local
              </a>
              <a href="#como-funciona" className="btn">
                Ver cómo funciona
              </a>
            </div>
          </div>
          <div className={s.ticket} role="img" aria-label="Ejemplo de un pedido armado que llega por WhatsApp">
            <span className={s.ticketTag}>Pedido de ejemplo</span>
            <strong>Nuevo pedido</strong>
            <dl>
              <div>
                <dt>1 x Producto de la carta</dt>
                <dd>$ 0.000</dd>
              </div>
              <div>
                <dt>Entrega</dt>
                <dd>Retiro</dd>
              </div>
              <div>
                <dt>Pago</dt>
                <dd>Transferencia</dd>
              </div>
            </dl>
            <p>
              <span>Total</span>
              <b>$ 0.000</b>
            </p>
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

        <section className={s.band}>
          <h2>Todo lo que necesita tu carta</h2>
          <ul>
            {FEATURES.map((feature) => (
              <li key={feature}>
                <Check size={18} aria-hidden /> {feature}
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
        </section>

        <section id="contacto" className={s.contact}>
          <div className={s.contactText}>
            <h2>¿Querés tu carta online?</h2>
            <p>Contanos qué vendés y te explicamos cómo empezar.</p>
            <ul>
              {CONTACT_POINTS.map((point) => (
                <li key={point}><Check size={20} aria-hidden /> {point}</li>
              ))}
            </ul>
          </div>
          {hasContact ? <ContactForm whatsapp={CONTACT.whatsapp} email={CONTACT.email} /> : null}
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.footerBrand}>
          <Brand />
          <p>Carta online para comercios locales, con los pedidos directo a WhatsApp.</p>
        </div>
        <nav aria-label="Secciones">
          <h3>Secciones</h3>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#locales">Locales adheridos</a>
          <a href="#contacto">Sumar mi local</a>
        </nav>
        <nav aria-label="Para locales">
          <h3>Para locales</h3>
          <Link href="/login">Ingresar al panel</Link>
        </nav>
        {hasContact ? (
          <div className={s.footerContact}>
            <h3>Contacto</h3>
            {CONTACT.whatsappUrl ? <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden /> WhatsApp</a> : null}
            {CONTACT.email ? <a href={`mailto:${CONTACT.email}`}><Mail size={16} aria-hidden /> {CONTACT.email}</a> : null}
          </div>
        ) : null}
      </footer>
    </>
  );
}
