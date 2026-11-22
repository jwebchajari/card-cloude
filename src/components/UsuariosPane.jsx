"use client";
import { useState } from "react";
import { ChevronDown, Plus, Search, X } from "lucide-react";
import { createUsuario, saveUsuario } from "@/lib/admin-data";
import { authError } from "@/lib/session";
import LocalChecks from "./LocalChecks";
import s from "./panel.module.css";

const plain = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const sameLocales = (a, b) => [...a].sort().join() === [...b].sort().join();

function initials(text) {
  const words = String(text || "").trim().split(/[\s@._-]+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || "?").slice(0, 2)).toUpperCase();
}

function NewUser({ locales, onDone }) {
  const empty = { nombre: "", email: "", password: "", locales: [], sendReset: true };
  const [f, setF] = useState(empty);
  const [state, setState] = useState({ busy: false, error: "", ok: "" });

  async function submit(e) {
    e.preventDefault();
    if (!f.email.trim() || f.password.length < 6) {
      setState({ busy: false, error: "Completá el email y una contraseña de al menos 6 caracteres.", ok: "" });
      return;
    }
    setState({ busy: true, error: "", ok: "" });
    try {
      await createUsuario(f);
      setState({ busy: false, error: "", ok: `Usuario ${f.email.trim()} creado.` });
      setF(empty);
      onDone();
    } catch (err) {
      setState({ busy: false, error: authError(err), ok: "" });
    }
  }

  return (
    <form className={`${s.card} ${s.newLocal}`} onSubmit={submit} noValidate>
      <h3>Nuevo usuario</h3>
      <label className="field">Nombre<input className="input" value={f.nombre} maxLength={80} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
      <label className="field">Email<input className="input" type="email" autoCapitalize="none" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      <label className="field">Contraseña inicial<input className="input" type="text" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
      <LocalChecks locales={locales} value={f.locales} onChange={(v) => setF({ ...f, locales: v })} />
      <label className={s.inlineCheck}><input type="checkbox" checked={f.sendReset} onChange={(e) => setF({ ...f, sendReset: e.target.checked })} /> Enviarle un mail para elegir su contraseña</label>
      {state.error ? <p className="error-text" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="ok-text" role="status">{state.ok}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={state.busy}>{state.busy ? "Creando..." : "Crear usuario"}</button>
    </form>
  );
}

function UserRow({ user, locales, names, isSelf, open, hidden, onToggle, onSaved }) {
  const [u, setU] = useState(user);
  const [state, setState] = useState("");
  const dirty = !sameLocales(u.locales, user.locales);
  const bodyId = `usuario-${user.uid}`;
  const title = user.nombre || user.email || user.uid;
  const linked = user.locales.map((slug) => names[slug] || slug).join(", ") || "Sin locales";
  const meta = [user.nombre ? user.email : "", linked].filter(Boolean).join(" · ");

  async function save() {
    setState("saving");
    try {
      await saveUsuario(u.uid, u);
      setState("");
      onSaved();
    } catch (err) {
      setState(authError(err));
    }
  }

  return (
    <li className={s.localItem} hidden={hidden}>
      <div className={s.localSummary}>
        <button type="button" className={`${s.localToggle} ${s.localToggleSolo}`} aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
          <span className={s.logoFallback} aria-hidden>{initials(user.nombre || user.email)}</span>
          <span className={s.localText}>
            <strong>{title}</strong>
            <small>{meta}{dirty ? <em> · Sin guardar</em> : null}</small>
          </span>
          {user.superadmin ? <span className={`${s.badge} ${s.badgeAlways}`}>{isSelf ? "Root (vos)" : "Root"}</span> : null}
          <ChevronDown className={s.chevron} size={20} aria-hidden />
        </button>
      </div>

      {open ? (
        <div id={bodyId} className={s.localBody}>
          <LocalChecks locales={locales} value={u.locales} onChange={(v) => setU({ ...u, locales: v })} />
          {state && state !== "saving" ? <p className="error-text" role="alert">{state}</p> : null}
          <div className={s.actions}>
            <button type="button" className="btn btn-primary" disabled={!dirty || state === "saving"} onClick={save}>{state === "saving" ? "Guardando..." : "Guardar"}</button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export default function UsuariosPane({ usuarios, locales, selfUid, onChange }) {
  const [query, setQuery] = useState("");
  const [openUid, setOpenUid] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const names = Object.fromEntries(locales.map((l) => [l.slug, l.nombre]));
  const needle = plain(query);
  const matches = (u) => !needle || plain(`${u.nombre} ${u.email} ${u.locales.join(" ")} ${u.locales.map((slug) => names[slug] || "").join(" ")}`).includes(needle);
  const count = usuarios.filter(matches).length;
  const extraRoots = usuarios.filter((u) => u.superadmin).length > 1;

  return (
    <div className={s.localsPane}>
      <div className={s.localsBar}>
        <div className={s.searchBox}>
          <Search size={18} aria-hidden />
          <input className="input" type="search" aria-label="Buscar usuario" placeholder="Nombre, email o local" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query ? <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQuery("")}><X size={18} aria-hidden /></button> : null}
        </div>
        <button type="button" className={`btn btn-primary ${s.newBtn}`} aria-expanded={showNew} aria-label={showNew ? "Cerrar nuevo usuario" : "Nuevo usuario"} onClick={() => setShowNew((v) => !v)}>
          {showNew ? <X size={18} aria-hidden /> : <Plus size={18} aria-hidden />} <span>{showNew ? "Cerrar" : "Nuevo usuario"}</span>
        </button>
      </div>

      <div hidden={!showNew}><NewUser locales={locales} onDone={onChange} /></div>

      {extraRoots ? <p className={s.warning} role="alert">Hay más de un usuario con permiso root. Quitá el campo superadmin de los que sobran desde la consola de Firebase.</p> : null}

      <p className="hint" role="status">{needle ? `${count} de ${usuarios.length} usuarios` : `${usuarios.length} ${usuarios.length === 1 ? "usuario" : "usuarios"}`}</p>

      {usuarios.length === 0 ? <p className="hint">Todavía no hay usuarios. Creá el primero con Nuevo usuario.</p> : null}
      {usuarios.length > 0 && count === 0 ? (
        <div className={s.noResults}>
          <p>No hay usuarios que coincidan con “{query.trim()}”.</p>
          <button type="button" className="btn" onClick={() => setQuery("")}>Limpiar búsqueda</button>
        </div>
      ) : null}

      <ul className={s.localList}>
        {usuarios.map((u) => (
          <UserRow
            key={`${u.uid}-${u.locales.join()}-${u.superadmin}`}
            user={u}
            locales={locales}
            names={names}
            isSelf={u.uid === selfUid}
            hidden={!matches(u)}
            open={openUid === u.uid}
            onToggle={() => setOpenUid((cur) => (cur === u.uid ? null : u.uid))}
            onSaved={onChange}
          />
        ))}
      </ul>
    </div>
  );
}
