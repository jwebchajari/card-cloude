import Link from "next/link";
import Brand from "@/components/Brand";
import s from "@/components/panel.module.css";

export const metadata = { title: "Página no encontrada", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <main className={s.center}>
      <div className={s.login}>
        <Brand />
        <h1>Esta página no existe</h1>
        <p className="hint">Puede que el link haya cambiado. Volvé al inicio para ver los locales adheridos.</p>
        <Link href="/" className="btn btn-primary">Ir al inicio</Link>
      </div>
    </main>
  );
}
