import Link from "next/link";
import Brand from "@/components/Brand";
import s from "@/app/landing.module.css";

export default function SiteHeader({ showLogin = true }) {
  return (
    <header className={s.header}>
      <Brand />
      <nav className={s.nav} aria-label="Principal">
        <Link href="/menu-digital">Menú digital</Link>
        <Link href="/catalogo-online">Catálogo online</Link>
        <Link href="/locales">Locales</Link>
        <Link href="/#contacto">Contacto</Link>
      </nav>
      {showLogin ? (
        <Link href="/login" className="btn">
          Ingresar
        </Link>
      ) : null}
    </header>
  );
}
