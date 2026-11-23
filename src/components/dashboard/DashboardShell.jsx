"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ExternalLink, LayoutGrid, LogOut, Package, Plus, QrCode, Shield, Store } from "lucide-react";
import Loading from "@/components/Loading";
import { getFicha } from "@/lib/admin-data";
import { canEdit, logout, profileLocales, useSession } from "@/lib/session";
import PanelLogo from "./PanelLogo";
import s from "./dashboard.module.css";

const Ctx = createContext(null);
export function useDashboard() {
  return useContext(Ctx);
}

function Notice({ title, children }) {
  return (
    <div className={`panel-ui ${s.center}`}>
      <div className={s.card}>
        <h1 className={s.h1}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

export default function DashboardShell({ children }) {
  const { local } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const [loaded, setLoaded] = useState(null);
  const fichaReady = loaded?.local === local;
  const ficha = fichaReady ? loaded.data : null;
  const allowed = session.status === "in" && canEdit(session.profile, local);

  useEffect(() => {
    if (session.status === "out") router.replace("/login");
  }, [session.status, router]);

  useEffect(() => {
    if (!allowed) return undefined;
    let alive = true;
    getFicha(local)
      .then((data) => alive && setLoaded({ local, data }))
      .catch(() => alive && setLoaded({ local, data: null }));
    return () => {
      alive = false;
    };
  }, [allowed, local]);

  if (session.status === "unconfigured") {
    return <Notice title="Falta configurar Firebase"><p className="hint">Cargá las variables NEXT_PUBLIC_FIREBASE_* y reiniciá el servidor.</p></Notice>;
  }
  if (session.status === "error") {
    return (
      <Notice title="No pudimos leer tu cuenta">
        <p className="hint">Revisá tu conexión y probá de nuevo.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
      </Notice>
    );
  }
  if (session.status !== "in") return <Loading />;
  if (!allowed) {
    return (
      <Notice title="Sin acceso a este local">
        <p className="hint">Tu cuenta no tiene permiso para editar “{local}”.</p>
        <Link href="/panel" className="btn btn-primary">Ir a mis locales</Link>
      </Notice>
    );
  }

  const base = `/panel/${local}`;
  const nav = [
    { href: base, label: "Productos", icon: Package, exact: true },
    { href: `${base}/agregar`, label: "Agregar", icon: Plus },
    { href: `${base}/datos`, label: "Datos del local", icon: Store },
    { href: `${base}/qr`, label: "QR", icon: QrCode },
  ];
  const isActive = (i) => (i.exact ? pathname === i.href || pathname.startsWith(`${base}/editar`) : pathname.startsWith(i.href));
  const isRoot = session.profile?.superadmin === true;
  const several = profileLocales(session.profile).length > 1;

  return (
    <Ctx.Provider value={{ local, user: session.user, profile: session.profile, ficha, fichaReady }}>
      <div className={`panel-ui ${s.shell}`}>
        <header className={s.topbar}>
          <Link href={base} className={s.brand}>
            <PanelLogo local={local} ficha={ficha} ready={fichaReady} />
            <span>
              {ficha?.nombre || "Panel"} <small>{local}</small>
            </span>
          </Link>
          <div className={s.topActions}>
            {ficha?.url ? (
              <a href={ficha.url} target="_blank" rel="noopener noreferrer" className={s.topLink}>
                <ExternalLink size={18} aria-hidden /> <span>Ver carta</span>
              </a>
            ) : null}
            {several && !isRoot ? (
              <Link href="/panel" className={s.topLink}>
                <LayoutGrid size={18} aria-hidden /> <span>Mis locales</span>
              </Link>
            ) : null}
            {isRoot ? (
              <Link href="/panel/admin" className={s.topLink}>
                <Shield size={18} aria-hidden /> <span>Admin</span>
              </Link>
            ) : null}
            <button
              type="button"
              className={s.topLink}
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              <LogOut size={18} aria-hidden /> <span>Salir</span>
            </button>
          </div>
        </header>

        <nav className={s.tabs} aria-label="Secciones del panel">
          {nav.map((i) => (
            <Link key={i.href} href={i.href} className={`${s.tab} ${isActive(i) ? s.tabActive : ""}`} aria-current={isActive(i) ? "page" : undefined}>
              <i.icon size={20} aria-hidden />
              <span>{i.label}</span>
            </Link>
          ))}
        </nav>

        {isRoot && session.profile?.locales?.[local] !== true ? (
          <p className={s.rootBar} role="note">
            <Shield size={16} aria-hidden />
            <span>Estás editando este local como root. Los cambios se publican en su carta.</span>
            <Link href="/panel/admin">Cambiar de local</Link>
          </p>
        ) : null}

        <main className={s.content}>{children}</main>
      </div>
    </Ctx.Provider>
  );
}
