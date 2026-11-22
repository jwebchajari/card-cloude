"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { listLocales, listSolicitudes, listUsuarios, resolveSolicitud } from "@/lib/admin-data";
import { logout, authError, useSession } from "@/lib/session";
import Brand from "./Brand";
import LocalChecks from "./LocalChecks";
import LocalesPane from "./LocalesPane";
import UsuariosPane from "./UsuariosPane";
import s from "./panel.module.css";

function SolicitudRow({ sol, locales, onDone }) {
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  async function resolve(assign) {
    try {
      await resolveSolicitud(sol, assign ? selected : []);
      onDone();
    } catch (err) {
      setError(authError(err));
    }
  }
  return (
    <li className={s.card}>
      <div className={s.rowHead}><span><strong>{sol.email}</strong><small>{sol.fecha ? new Date(sol.fecha).toLocaleString("es-AR") : ""}</small></span></div>
      <LocalChecks locales={locales} value={selected} onChange={setSelected} />
      {error ? <p className="error-text">{error}</p> : null}
      <div className={s.actions}>
        <button type="button" className="btn" onClick={() => resolve(false)}>Descartar</button>
        <button type="button" className="btn btn-primary" disabled={!selected.length} onClick={() => resolve(true)}>Dar acceso</button>
      </div>
    </li>
  );
}

async function fetchAll() {
  const [locales, usuarios, solicitudes] = await Promise.all([listLocales(), listUsuarios(), listSolicitudes()]);
  return { locales, usuarios, solicitudes };
}

export default function AdminApp() {
  const router = useRouter();
  const session = useSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("locales");
  const isSuper = session.status === "in" && session.profile?.superadmin === true;
  const load = useCallback(() => {
    fetchAll().then(setData).catch((err) => setError(authError(err)));
  }, []);

  useEffect(() => {
    if (session.status === "out") router.replace("/login");
    if (session.status === "error" || (session.status === "in" && !isSuper)) router.replace("/panel");
    if (isSuper) load();
  }, [session.status, isSuper, router, load]);

  if (!isSuper || (!data && !error)) return <main className={s.center}><p role="status">Cargando...</p></main>;
  if (error) return <main className={s.center}><p className="error-text" role="alert">{error}</p></main>;

  const tabs = [["locales", `Locales (${data.locales.length})`], ["usuarios", `Usuarios (${data.usuarios.length})`], ["solicitudes", `Solicitudes (${data.solicitudes.length})`]];

  return (
    <div className={s.admin}>
      <header className={s.adminHead}>
        <Brand href="/panel/admin" />
        <button type="button" className="btn" onClick={async () => { await logout(); router.replace("/login"); }}><LogOut size={18} aria-hidden /> Salir</button>
      </header>
      <nav className={s.tabs} aria-label="Administración">
        {tabs.map(([id, label]) => <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{label}</button>)}
      </nav>
      <main className={s.adminGrid}>
        {tab === "locales" ? <LocalesPane locales={data.locales} onChange={load} /> : null}
        {tab === "usuarios" ? <UsuariosPane usuarios={data.usuarios} locales={data.locales} selfUid={session.user.uid} onChange={load} /> : null}
        {tab === "solicitudes" ? (
          <ul className={s.plainList}>
            {data.solicitudes.length ? data.solicitudes.map((sol) => <SolicitudRow key={sol.uid} sol={sol} locales={data.locales} onDone={load} />) : <li className="hint">No hay solicitudes pendientes.</li>}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
