"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { listDirectorio } from "@/lib/admin-data";
import { logout, profileLocales, requestAccess, useSession } from "@/lib/session";
import s from "./panel.module.css";

/** Decide el destino después del login: admin, su único local, selector o solicitud. */
export default function PanelHome() {
  const router = useRouter();
  const session = useSession();
  const [directorio, setDirectorio] = useState(null);
  const [requested, setRequested] = useState(false);
  const signedIn = session.status === "in";
  const isRoot = signedIn && session.profile?.superadmin === true;
  const mine = signedIn ? profileLocales(session.profile) : [];
  const mineKey = mine.join(",");

  useEffect(() => {
    if (session.status === "out") router.replace("/login");
    if (!signedIn) return;
    const slugs = mineKey ? mineKey.split(",") : [];
    if (isRoot) router.replace("/panel/admin");
    else if (slugs.length === 1) router.replace(`/panel/${slugs[0]}`);
    else if (slugs.length > 1) listDirectorio().then(setDirectorio).catch(() => setDirectorio({}));
    else requestAccess(session.user).catch(() => {}).finally(() => setRequested(true));
  }, [session.status, session.user, signedIn, isRoot, mineKey, router]);

  async function out() {
    await logout();
    router.replace("/login");
  }

  if (session.status === "error") {
    return (
      <main className={s.center}>
        <div className={s.login}>
          <h1>No pudimos leer tu cuenta</h1>
          <p className="hint">Revisá tu conexión y probá de nuevo.</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
          <button type="button" className="btn" onClick={out}><LogOut size={18} aria-hidden /> Salir</button>
        </div>
      </main>
    );
  }
  if (requested) {
    return (
      <main className={s.center}>
        <div className={s.login}>
          <h1>Pedido enviado</h1>
          <p className="hint">Tu cuenta todavía no tiene un local asignado. Ya quedó registrado tu pedido de acceso.</p>
          <button type="button" className="btn" onClick={out}><LogOut size={18} aria-hidden /> Salir</button>
        </div>
      </main>
    );
  }
  if (!directorio) return <main className={s.center}><p role="status">Cargando...</p></main>;

  return (
    <main className={s.center}>
      <div className={s.login}>
        <h1>Tus locales</h1>
        <ul className={s.plainList}>
          {mine.map((slug) => (
            <li key={slug}>
              <Link className={s.localLink} href={`/panel/${slug}`}>
                <span><strong>{directorio[slug]?.nombre || slug}</strong><small>Abrir panel</small></span>
                <ChevronRight size={20} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <button type="button" className="btn" onClick={out}><LogOut size={18} aria-hidden /> Salir</button>
      </div>
    </main>
  );
}
