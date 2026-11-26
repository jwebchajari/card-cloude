"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Download, ExternalLink, ImagePlus, Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import LocalCard from "./LocalCard";
import LogoEditor from "./LogoEditor";
import PhotoEditor from "./dashboard/PhotoEditor";
import { createLocal, getComidas, saveFicha } from "@/lib/admin-data";
import { FOTO_FORMAS } from "@/lib/catalogo";
import { canOpenInBrowser, cloudinaryConfigured, uploadImage, validateImageFile } from "@/lib/cloudinary-client";
import { cldUrl } from "@/lib/cloudinary-url";
import { downloadEnvFile } from "@/lib/connection";
import { authError } from "@/lib/session";
import { similarSlugs, slugError, slugify } from "@/lib/slug";
import s from "./panel.module.css";

const message = (err) => (err?.code ? authError(err) : err?.message || "Algo salió mal.");
const plain = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const FICHA_KEYS = ["nombre", "ciudad", "rubro", "url", "visible", "logo", "portada", "fotoForma"];

function initials(nombre) {
  const words = String(nombre || "").trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || "?").slice(0, 2)).toUpperCase();
}

/** Usa el logo cargado; si no hay, prueba los que ya publica el sitio del local y cae en iniciales. */
function LocalLogo({ nombre, logo, url }) {
  const sources = useMemo(() => {
    if (logo) return [cldUrl(logo, "f_auto,q_auto,c_fit,w_112,h_112")];
    return url ? [`${url}/logo-sm.webp`, `${url}/logo.png`] : [];
  }, [logo, url]);
  const [failed, setFailed] = useState(0);
  const src = sources[failed];

  if (!src) return <span className={s.logoFallback} aria-hidden>{initials(nombre)}</span>;
  return <img className={s.logoImg} src={src} alt="" width={44} height={44} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed((n) => n + 1)} />;
}

/** Elige la foto de portada del inicio entre las fotos de los productos del local. */
function PortadaPicker({ slug, value, editadas, onChange, onAuto }) {
  const [fotos, setFotos] = useState(null);
  const [rotas, setRotas] = useState([]);
  // Las portadas editadas son copias: no están entre las fotos de los productos.
  const propias = [...new Set([...editadas, ...(/^https:\/\//i.test(value || "") ? [value] : [])])]
    .filter((url) => !fotos?.some((foto) => foto.url === url))
    .map((url) => ({ url, nombre: "Portada editada" }));
  const visibles = fotos && [...propias, ...fotos].filter((foto) => !rotas.includes(foto.url) || foto.url === value);

  useEffect(() => {
    let alive = true;
    getComidas(slug)
      .then((comidas) => {
        if (!alive) return;
        const byUrl = new Map();
        for (const c of Object.values(comidas)) if (/^https:\/\//i.test(c?.imagen || "") && !byUrl.has(c.imagen)) byUrl.set(c.imagen, c.nombre || "Producto");
        setFotos([...byUrl].map(([url, nombre]) => ({ url, nombre })));
        // La misma foto que usa el inicio cuando no hay portada elegida.
        onAuto(Object.values(comidas).find((c) => c && !c.oculto && /^https:\/\//i.test(c.imagen || ""))?.imagen || "");
      })
      .catch(() => alive && setFotos([]));
    return () => {
      alive = false;
    };
  }, [slug, onAuto]);

  return (
    <fieldset className={s.portadas}>
      <legend>Foto de portada en el inicio</legend>
      {fotos === null ? <p className="hint">Cargando fotos...</p> : null}
      {visibles?.length === 0 ? <p className="hint">Este local todavía no tiene fotos de productos.</p> : null}
      {visibles?.length ? (
        <div className={s.portadaGrid}>
          <label className={s.portadaOption}>
            <input type="radio" name={`portada-${slug}`} checked={value === "logo"} onChange={() => onChange("logo")} />
            <span className={s.portadaNone}>Solo logo</span>
          </label>
          {visibles.map((foto) => (
            <label key={foto.url} className={s.portadaOption} title={foto.nombre}>
              <input type="radio" name={`portada-${slug}`} checked={value === foto.url} onChange={() => onChange(foto.url)} />
              <img src={cldUrl(foto.url, "f_auto,q_auto,c_fill,w_200,h_150")} alt={foto.nombre} width={200} height={150} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setRotas((list) => (list.includes(foto.url) ? list : [...list, foto.url]))} />
            </label>
          ))}
        </div>
      ) : null}
    </fieldset>
  );
}

function NewLocal({ locales, onDone }) {
  const empty = { nombre: "", slug: "", ciudad: "", rubro: "", url: "", visible: false };
  const [f, setF] = useState(empty);
  const [slugTouched, setSlugTouched] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [state, setState] = useState({ busy: false, error: "", created: null });
  const existing = useMemo(() => locales.map((l) => l.slug), [locales]);
  const invalid = f.slug ? slugError(f.slug) : "";
  const duplicate = existing.includes(f.slug);
  const similar = f.slug && !invalid ? similarSlugs(f.slug, existing) : [];
  const blocked = !f.nombre.trim() || !f.slug || Boolean(invalid) || duplicate || (similar.length > 0 && !confirmed) || state.busy;

  function setNombre(nombre) {
    setConfirmed(false);
    setF({ ...f, nombre, slug: slugTouched ? f.slug : slugify(nombre) });
  }

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, error: "", created: null });
    try {
      const created = await createLocal(f);
      setF(empty);
      setSlugTouched(false);
      setConfirmed(false);
      setState({ busy: false, error: "", created });
      onDone();
    } catch (err) {
      setState({ busy: false, error: message(err), created: null });
    }
  }

  return (
    <form className={`${s.card} ${s.newLocal}`} onSubmit={submit} noValidate>
      <h3>Nuevo local</h3>
      <label className="field">Nombre del local<input className="input" value={f.nombre} maxLength={80} onChange={(e) => setNombre(e.target.value)} /></label>
      <label className="field">
        Identificador
        <input className="input" value={f.slug} autoCapitalize="none" onChange={(e) => { setSlugTouched(true); setConfirmed(false); setF({ ...f, slug: slugify(e.target.value) }); }} />
        <span className="hint">Se guarda como locales/{f.slug || "nombre-del-local"}</span>
      </label>
      {invalid ? <p className="error-text">{invalid}</p> : null}
      {duplicate ? <p className="error-text">Ya existe un local con ese identificador.</p> : null}
      {similar.length ? (
        <label className={s.warning}>
          <span>Se parece a {similar.join(", ")}. ¿Es un local distinto?</span>
          <span><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /> Sí, crear uno nuevo</span>
        </label>
      ) : null}
      <div className={s.twoCols}>
        <label className="field">Ciudad<input className="input" value={f.ciudad} maxLength={80} onChange={(e) => setF({ ...f, ciudad: e.target.value })} /></label>
        <label className="field">Rubro<input className="input" value={f.rubro} maxLength={60} onChange={(e) => setF({ ...f, rubro: e.target.value })} /></label>
      </div>
      <label className="field">URL del sitio (opcional)<input className="input" type="url" value={f.url} placeholder="https://..." onChange={(e) => setF({ ...f, url: e.target.value })} /></label>
      {state.error ? <p className="error-text" role="alert">{state.error}</p> : null}
      {state.created ? (
        <div className={s.created} role="status">
          <p>Local <strong>{state.created.slug}</strong> creado.</p>
          <button type="button" className="btn btn-primary" onClick={() => downloadEnvFile(state.created)}><Download size={18} aria-hidden /> Descargar conexión</button>
        </div>
      ) : null}
      <button type="submit" className="btn btn-primary" disabled={blocked}>{state.busy ? "Creando..." : "Crear local"}</button>
    </form>
  );
}

function LocalRow({ local, open, hidden, onToggle, onSaved }) {
  const [f, setF] = useState(local);
  const [state, setState] = useState("");
  const [uploading, setUploading] = useState(null);
  const [autoFoto, setAutoFoto] = useState("");
  const [editorSources, setEditorSources] = useState(null);
  const [coverSource, setCoverSource] = useState(null);
  const [editadas, setEditadas] = useState([]);
  const fileRef = useRef(null);
  const site = String(f.url || "").replace(/\/+$/, "");
  const currentLogo = f.logo ? [{ src: f.logo }] : /^https:\/\//i.test(site) ? [{ src: `${site}/logo.png` }, { src: `${site}/logo-sm.webp` }] : [];
  const previewLocal = { ...f, portada: f.portada === "logo" ? "" : f.portada || autoFoto };
  const dirty = FICHA_KEYS.some((k) => f[k] !== local[k]);
  const bodyId = `local-${local.slug}`;
  const meta = [local.slug, local.ciudad, local.rubro, `${local.productos} ${local.productos === 1 ? "producto" : "productos"}`].filter(Boolean).join(" · ");

  async function pickLogo(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const invalid = validateImageFile(file);
    if (invalid) {
      setState(invalid);
      return;
    }
    if (!(await canOpenInBrowser(file))) {
      setState("No pudimos abrir ese archivo. Exportalo como JPG o PNG.");
      return;
    }
    setState("");
    setEditorSources([{ file }]);
  }

  async function applyCover(blob) {
    setCoverSource(null);
    setState("");
    setUploading(0);
    try {
      const portada = await uploadImage(blob, local.slug, setUploading);
      setEditadas((list) => [portada, ...list]);
      setF((prev) => ({ ...prev, portada }));
    } catch (err) {
      setState(message(err));
    } finally {
      setUploading(null);
    }
  }

  async function applyLogo(blob) {
    setEditorSources(null);
    setState("");
    setUploading(0);
    try {
      const logo = await uploadImage(blob, local.slug, setUploading);
      setF((prev) => ({ ...prev, logo }));
    } catch (err) {
      setState(message(err));
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setState("saving");
    try {
      await saveFicha(local.slug, f);
      setState("");
      onSaved();
    } catch (err) {
      setState(message(err));
    }
  }

  return (
    <li className={s.localItem} hidden={hidden}>
      <div className={s.localSummary}>
        <button type="button" className={s.localToggle} aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
          <LocalLogo key={`${f.logo}|${f.url}`} nombre={f.nombre} logo={f.logo} url={f.url} />
          <span className={s.localText}>
            <strong>{local.nombre}</strong>
            <small>{meta}{dirty ? <em> · Sin guardar</em> : null}</small>
          </span>
          {local.visible ? <span className={s.badge}>Visible</span> : null}
          <ChevronDown className={s.chevron} size={20} aria-hidden />
        </button>
        <Link className={`${s.iconLink} ${s.manageLink}`} href={`/panel/${local.slug}`} aria-label={`Gestionar productos de ${local.nombre}`} title="Gestionar productos">
          <Package size={20} aria-hidden />
          <span>Gestionar</span>
        </Link>
      </div>

      {open ? (
        <div id={bodyId} className={s.localBody}>
          <aside className={s.cardPreview}>
            <p>Así se ve en el inicio</p>
            <LocalCard key={`${f.logo}|${f.url}|${previewLocal.portada}`} preview local={previewLocal} />
          </aside>
          <div className={s.localFields}>
          <div className={s.logoField}>
            <LocalLogo key={`edit-${f.logo}|${f.url}`} nombre={f.nombre} logo={f.logo} url={f.url} />
            <div className={s.logoActions}>
              <input ref={fileRef} type="file" accept="image/*" className="visually-hidden" tabIndex={-1} aria-label={`Logo de ${local.nombre}`} onChange={pickLogo} />
              <button type="button" className="btn" disabled={uploading !== null || !cloudinaryConfigured()} onClick={() => fileRef.current?.click()}>
                <ImagePlus size={18} aria-hidden /> {uploading !== null ? `Subiendo ${uploading}%` : f.logo ? "Cambiar logo" : "Subir logo"}
              </button>
              {currentLogo.length ? <button type="button" className="btn" disabled={uploading !== null || !cloudinaryConfigured()} onClick={() => setEditorSources(currentLogo)}><Pencil size={18} aria-hidden /> Editar logo</button> : null}
              {f.logo ? <button type="button" className="btn" onClick={() => setF({ ...f, logo: "" })}><Trash2 size={18} aria-hidden /> Quitar</button> : null}
            </div>
          </div>
          {!cloudinaryConfigured() ? <p className="hint">Para subir logos falta configurar Cloudinary.</p> : null}
          <PortadaPicker slug={local.slug} value={f.portada} editadas={editadas} onAuto={setAutoFoto} onChange={(portada) => setF((prev) => ({ ...prev, portada }))} />
          {previewLocal.portada ? (
            <div className={s.logoActions}>
              <button type="button" className="btn" disabled={uploading !== null || !cloudinaryConfigured()} onClick={() => setCoverSource({ src: previewLocal.portada })}>
                <Pencil size={18} aria-hidden /> {uploading !== null ? `Subiendo ${uploading}%` : "Editar foto de portada"}
              </button>
            </div>
          ) : null}
          <label className="field">Nombre público<input className="input" value={f.nombre} maxLength={80} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
          <div className={s.twoCols}>
            <label className="field">Ciudad<input className="input" value={f.ciudad} maxLength={80} onChange={(e) => setF({ ...f, ciudad: e.target.value })} /></label>
            <label className="field">Rubro<input className="input" value={f.rubro} maxLength={60} onChange={(e) => setF({ ...f, rubro: e.target.value })} /></label>
          </div>
          <label className="field">
            Forma de las fotos en la carta
            <select className="input" value={f.fotoForma} onChange={(e) => setF({ ...f, fotoForma: e.target.value })}>
              {Object.entries(FOTO_FORMAS).map(([id, forma]) => (
                <option key={id} value={id}>
                  {forma.label}
                </option>
              ))}
            </select>
            <span className="hint">Tiene que coincidir con el diseño de la carta. El panel la usa en la vista previa y en el editor de fotos.</span>
          </label>
          <label className="field">URL del sitio<input className="input" type="url" value={f.url} placeholder="https://..." onChange={(e) => setF({ ...f, url: e.target.value })} /></label>
          <label className={s.inlineCheck}><input type="checkbox" checked={f.visible} disabled={!/^https:\/\//i.test(f.url)} onChange={(e) => setF({ ...f, visible: e.target.checked })} /> Mostrar en locales adheridos</label>
          {state && state !== "saving" ? <p className="error-text" role="alert">{state}</p> : null}
          <div className={s.actions}>
            <Link className="btn" href={`/panel/${local.slug}`}><Package size={18} aria-hidden /> Gestionar productos</Link>
            <Link className="btn" href={`/panel/${local.slug}/agregar`}><Plus size={18} aria-hidden /> Agregar producto</Link>
            <button type="button" className="btn" onClick={() => downloadEnvFile(local)}><Download size={18} aria-hidden /> Conexión</button>
            {local.url ? <a className="btn" href={local.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={18} aria-hidden /> Ver carta</a> : null}
            <button type="button" className="btn btn-primary" disabled={!dirty || state === "saving" || uploading !== null} onClick={save}>{state === "saving" ? "Guardando..." : "Guardar"}</button>
          </div>
          </div>
          {editorSources ? <LogoEditor sources={editorSources} local={previewLocal} onCancel={() => setEditorSources(null)} onDone={applyLogo} /> : null}
          {coverSource ? (
            <div className="panel-ui">
              <PhotoEditor
                source={coverSource}
                title="Editar foto de portada"
                onCancel={() => setCoverSource(null)}
                onDone={applyCover}
                renderPreview={(ref) => (
                  <div className={s.cardPreview}>
                    <LocalCard preview local={previewLocal} coverSlot={<canvas ref={ref} width={560} height={420} aria-hidden />} />
                  </div>
                )}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export default function LocalesPane({ locales, onChange }) {
  const [query, setQuery] = useState("");
  const [openSlug, setOpenSlug] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const needle = plain(query);
  const matches = (l) => !needle || plain(`${l.nombre} ${l.slug} ${l.ciudad} ${l.rubro}`).includes(needle);
  const count = locales.filter(matches).length;

  return (
    <div className={s.localsPane}>
      <div className={s.localsBar}>
        <div className={s.searchBox}>
          <Search size={18} aria-hidden />
          <input className="input" type="search" aria-label="Buscar local" placeholder="Nombre, ciudad o rubro" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query ? <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQuery("")}><X size={18} aria-hidden /></button> : null}
        </div>
        <button type="button" className={`btn btn-primary ${s.newBtn}`} aria-expanded={showNew} aria-label={showNew ? "Cerrar nuevo local" : "Nuevo local"} onClick={() => setShowNew((v) => !v)}>
          {showNew ? <X size={18} aria-hidden /> : <Plus size={18} aria-hidden />} <span>{showNew ? "Cerrar" : "Nuevo local"}</span>
        </button>
      </div>

      <div hidden={!showNew}><NewLocal locales={locales} onDone={onChange} /></div>

      <p className="hint" role="status">{needle ? `${count} de ${locales.length} locales` : `${locales.length} ${locales.length === 1 ? "local" : "locales"}`}</p>

      {locales.length === 0 ? <p className="hint">Todavía no hay locales. Creá el primero con Nuevo local.</p> : null}
      {locales.length > 0 && count === 0 ? (
        <div className={s.noResults}>
          <p>No hay locales que coincidan con “{query.trim()}”.</p>
          <button type="button" className="btn" onClick={() => setQuery("")}>Limpiar búsqueda</button>
        </div>
      ) : null}

      <ul className={s.localList}>
        {locales.map((l) => (
          <LocalRow
            key={`${l.slug}-${l.nombre}-${l.url}-${l.visible}-${l.ciudad}-${l.rubro}-${l.logo}-${l.portada}-${l.fotoForma}`}
            local={l}
            hidden={!matches(l)}
            open={openSlug === l.slug}
            onToggle={() => setOpenSlug((cur) => (cur === l.slug ? null : l.slug))}
            onSaved={onChange}
          />
        ))}
      </ul>
    </div>
  );
}
