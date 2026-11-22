import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import ContactSection from "@/components/site/ContactSection";
import LocalesDirectory from "@/components/site/LocalesDirectory";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { getTodosLosLocales } from "@/lib/directorio";
import { directorioJsonLd, pageMeta } from "@/lib/seo";
import s from "../pages.module.css";

export const metadata = pageMeta({
  title: "Locales con menú digital y catálogo online",
  description: "Conocé los comercios que usan CardCloude. Mirá su menú digital o catálogo online, sus horarios y hacé tu pedido directo por WhatsApp.",
  path: "/locales",
});

export default async function LocalesPage() {
  const locales = await getTodosLosLocales();
  return (
    <>
      <JsonLd data={directorioJsonLd(locales)} />
      <SiteHeader />
      <main>
        <div className={s.wrap}>
          <Breadcrumbs items={[["Inicio", "/"], ["Locales", "/locales"]]} />
        </div>
        <section className={s.pageHero}>
          <h1>Locales con menú digital y catálogo online</h1>
          <p>Encontrá comercios que ya tienen su carta en CardCloude, mirá sus productos y hacé tu pedido directo por WhatsApp.</p>
        </section>
        <section className={s.directory}>
          {locales.length ? <LocalesDirectory locales={locales} /> : <p className="hint">Pronto vas a ver acá los locales que ya usan CardCloude.</p>}
        </section>
        <ContactSection title="¿Querés sumar tu local?" />
      </main>
      <SiteFooter />
    </>
  );
}
