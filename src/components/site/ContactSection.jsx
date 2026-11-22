import { Check } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { CONTACT } from "@/lib/site";
import s from "@/app/landing.module.css";

const POINTS = ["Sin aplicaciones para tus clientes", "Sin intermediarios en tus pedidos", "Vos cambiás precios y fotos desde tu panel"];

export default function ContactSection({ title = "¿Querés tu carta online?" }) {
  return (
    <section id="contacto" className={s.contact}>
      <div className={s.contactText}>
        <h2>{title}</h2>
        <p>Contanos qué vendés y te explicamos cómo empezar.</p>
        <ul>
          {POINTS.map((point) => (
            <li key={point}><Check size={20} aria-hidden /> {point}</li>
          ))}
        </ul>
      </div>
      {CONTACT.whatsapp || CONTACT.email ? <ContactForm whatsapp={CONTACT.whatsapp} email={CONTACT.email} /> : null}
    </section>
  );
}
