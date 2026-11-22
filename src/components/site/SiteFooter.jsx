import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import Brand from "@/components/Brand";
import { CONTACT } from "@/lib/site";
import { SOLUCIONES } from "@/lib/soluciones";
import s from "@/app/landing.module.css";

export default function SiteFooter() {
  const hasContact = CONTACT.whatsapp || CONTACT.email;
  return (
    <footer className={s.footer}>
      <div className={s.footerBrand}>
        <Brand tone="white" />
        <p>Menú digital y catálogo online para comercios locales, con los pedidos directo a WhatsApp.</p>
      </div>
      <nav aria-label="Soluciones">
        <h3>Soluciones</h3>
        {SOLUCIONES.map((x) => <Link key={x.slug} href={`/${x.slug}`}>{x.label}</Link>)}
      </nav>
      <nav aria-label="Secciones">
        <h3>CardCloude</h3>
        <Link href="/#como-funciona">Cómo funciona</Link>
        <Link href="/locales">Locales adheridos</Link>
        <Link href="/#preguntas">Preguntas frecuentes</Link>
        <Link href="/#contacto">Sumar mi local</Link>
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
  );
}
