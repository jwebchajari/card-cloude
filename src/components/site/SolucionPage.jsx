import Link from "next/link";
import { Check } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { pageMeta, solucionJsonLd } from "@/lib/seo";
import { RUBROS, SOLUCIONES, solucionBySlug } from "@/lib/soluciones";
import Breadcrumbs from "./Breadcrumbs";
import ContactSection from "./ContactSection";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import l from "@/app/landing.module.css";
import s from "@/app/pages.module.css";

export function solucionMetadata(slug) {
  const x = solucionBySlug(slug);
  return pageMeta({ title: x.title, description: x.description, path: `/${x.slug}` });
}

export default function SolucionPage({ slug }) {
  const x = solucionBySlug(slug);
  const related = SOLUCIONES.filter((o) => o.slug !== slug);

  return (
    <>
      <JsonLd data={solucionJsonLd(x)} />
      <SiteHeader />
      <main>
        <div className={s.wrap}>
          <Breadcrumbs items={[["Inicio", "/"], [x.label, `/${x.slug}`]]} />
        </div>
        <section className={s.pageHero}>
          <h1>{x.h1}</h1>
          <p>{x.intro}</p>
          <div className={l.heroActions}>
            <a href="#contacto" className="btn btn-primary">Quiero mi {x.label.toLowerCase()}</a>
            <Link href="/locales" className="btn">Ver locales adheridos</Link>
          </div>
        </section>

        <section className={l.section}>
          <div className={s.prose}>
            {x.sections.map(([title, text]) => (
              <article key={title}>
                <h2>{title}</h2>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={l.band}>
          <h2>Qué incluye</h2>
          <ul>
            {x.benefits.map((b) => <li key={b}><Check size={18} aria-hidden /> {b}</li>)}
          </ul>
        </section>

        <section className={l.section}>
          <h2>Para qué comercios sirve</h2>
          <ul className={s.chips}>
            {RUBROS.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </section>

        <section className={l.section}>
          <h2>Preguntas frecuentes</h2>
          <div className={l.faq}>
            {x.faqs.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={l.section}>
          <h2>Otras soluciones</h2>
          <ul className={s.solutions}>
            {related.map((o) => (
              <li key={o.slug}>
                <Link href={`/${o.slug}`}><strong>{o.label}</strong><span>{o.short}</span></Link>
              </li>
            ))}
          </ul>
        </section>

        <ContactSection title={`Empezá con tu ${x.label.toLowerCase()}`} />
      </main>
      <SiteFooter />
    </>
  );
}
