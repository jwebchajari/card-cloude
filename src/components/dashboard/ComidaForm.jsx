"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import Loading from "@/components/Loading";
import { deleteComida, getComida, getComidas, saveComida } from "@/lib/admin-data";
import { authError } from "@/lib/session";
import { CATEGORIES, MAX_BASE_MEATS, MAX_MEATS, MEAT_PRICE_KEYS, MIN_MEATS, cleanIngredients, hasIngredients, ingredientsText, meatLabel, usesMeats } from "@/lib/catalogo";
import { useDashboard } from "./DashboardShell";
import ImageUploader from "./ImageUploader";
import IngredientPicker from "./IngredientPicker";
import PublishPreview from "./PublishPreview";
import s from "./dashboard.module.css";

const EMPTY = {
  nombre: "",
  descripcion: "",
  categoria: "otros",
  valor: "",
  oferta: false,
  valorOferta: "",
  imagen: "",
  medallones: 0,
  precios: { doble: "", triple: "", cuadruple: "" },
  ingredientes: { pan: [], carne: [], aderezos: [] },
  oculto: false,
};

/**
 * Next conserva el estado de la página al navegar (Activity). Tras guardar o borrar se cambia la
 * key al ocultarse, así el formulario y sus hijos vuelven limpios. Un borrador sin guardar se conserva.
 */
export default function ComidaForm({ id = null }) {
  const [version, setVersion] = useState(0);
  const finished = useRef(false);
  const visible = useRef(false);

  useLayoutEffect(() => {
    visible.current = true;
    return () => {
      visible.current = false;
      if (finished.current) {
        finished.current = false;
        setVersion((v) => v + 1);
      }
    };
  }, []);

  function onFinished() {
    // Si el guardado termina con la pantalla ya oculta, no va a haber otra limpieza.
    if (visible.current) finished.current = true;
    else setVersion((v) => v + 1);
  }

  return <ComidaEditor key={version} id={id} onFinished={onFinished} />;
}

function ComidaEditor({ id, onFinished }) {
  const { local } = useDashboard();
  const router = useRouter();
  const [form, setForm] = useState(id ? null : EMPTY);
  const [original, setOriginal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [descMode, setDescMode] = useState("ingredientes");
  const [knownIngredients, setKnownIngredients] = useState([]);

  // Los ingredientes cargados en otros productos también aparecen como píldoras.
  useEffect(() => {
    let alive = true;
    getComidas(local)
      .then((all) => alive && setKnownIngredients(Object.values(all).map((p) => p?.ingredientes).filter(Boolean)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [local]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    getComida(local, id)
      .then((c) => {
        if (!alive) return;
        if (!c) {
          setNotFound(true);
          return;
        }
        setForm({ ...EMPTY, ...c, medallones: Number(c.medallones) || (c.categoria === "hamburguesas" ? 1 : 0), valor: String(c.valor ?? ""), valorOferta: c.valorOferta ? String(c.valorOferta) : "", precios: { doble: String(c.precios?.doble ?? ""), triple: String(c.precios?.triple ?? ""), cuadruple: String(c.precios?.cuadruple ?? "") }, descripcion: c.descripcion || "", ingredientes: cleanIngredients(c.ingredientes) });
        setDescMode(hasIngredients(c.ingredientes) || !c.descripcion ? "ingredientes" : "manual");
        setOriginal(c.imagen || "");
      })
      .catch((e) => alive && setError(authError(e)));
    return () => {
      alive = false;
    };
  }, [id, local]);

  if (notFound) return <p className="hint">Ese producto ya no existe.</p>;
  if (!form) return <Loading />;

  // Base de carnes visible en el selector: en hamburguesas mínimo 1, y nunca más de MAX_BASE_MEATS
  // (con 5 incluidas el cliente no tendría nada para elegir).
  const rawMeats = Number(form.medallones) || 0;
  const meatsValue = Math.min(MAX_BASE_MEATS, form.categoria === "hamburguesas" ? Math.max(MIN_MEATS, rawMeats) : rawMeats);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const onInput = (k) => (e) => set(k)(e.target.type === "checkbox" ? e.target.checked : e.target.value);
  const numeric = (k) => (e) => set(k)(e.target.value.replace(/\D/g, "").slice(0, 9));
  const setMeatPrice = (k) => (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 9);
    setForm((f) => ({ ...f, precios: { ...f.precios, [k]: value } }));
  };

  const offerInvalid = form.oferta && !(Number(form.valorOferta) > 0 && Number(form.valorOferta) < Number(form.valor));

  // Sin píldoras elegidas se conserva el texto que ya tenía, para no borrar una descripción al cambiar de modo.
  const usesIngredients = descMode === "ingredientes" && hasIngredients(form.ingredientes);
  const finalDescripcion = usesIngredients ? ingredientsText(form.ingredientes) : form.descripcion;

  function changeDescMode(mode) {
    if (mode === "manual") setForm((f) => ({ ...f, descripcion: finalDescripcion }));
    setDescMode(mode);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) return setError("Poné un nombre.");
    if (!(Number(form.valor) > 0)) return setError("Poné un precio mayor a 0.");
    if (offerInvalid) return setError("El precio de oferta tiene que ser menor al precio normal.");
    if (finalDescripcion.length > 600) return setError("Los ingredientes superan los 600 caracteres. Quitá alguno.");
    setSaving(true);
    setError("");
    try {
      await saveComida(
        local,
        id,
        { ...form, medallones: meatsValue, descripcion: finalDescripcion, ingredientes: usesIngredients ? form.ingredientes : null },
        original
      );
      onFinished();
      router.push(`/panel/${local}`);
    } catch (err) {
      setError(authError(err));
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!window.confirm(`¿Borrar "${form.nombre}"? No se puede deshacer.`)) return;
    setSaving(true);
    try {
      await deleteComida(local, id, form.imagen);
      onFinished();
      router.push(`/panel/${local}`);
    } catch (err) {
      setError(authError(err));
      setSaving(false);
    }
  }

  return (
    <form className={s.formGrid} onSubmit={submit} noValidate>
      <div className={s.formMain}>
        <h1 className={s.h1}>{id ? "Editar producto" : "Nuevo producto"}</h1>

        <div className={s.row2}>
          <label className="field">
            <span>Nombre</span>
            <input className="input" value={form.nombre} onChange={onInput("nombre")} maxLength={120} required />
          </label>
          <label className="field">
            <span>Categoría</span>
            <select
              className="input"
              value={form.categoria}
              onChange={(e) => {
                const categoria = e.target.value;
                setForm((f) => ({ ...f, categoria, medallones: categoria === "hamburguesas" ? Math.max(1, Number(f.medallones) || 0) : 0 }));
              }}
            >
              {(CATEGORIES.some((c) => c.id === form.categoria) ? CATEGORIES : [...CATEGORIES, { id: form.categoria, label: form.categoria }]).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <section className={s.formSection} aria-labelledby="sec-foto">
          <h2 id="sec-foto" className={s.h2}>
            Foto
          </h2>
          <ImageUploader value={form.imagen} onChange={set("imagen")} local={local} product={{ ...form, descripcion: finalDescripcion }} />
        </section>

        <section className={s.formSection} aria-labelledby="sec-ingredientes">
          <h2 id="sec-ingredientes" className={s.h2}>
            Descripción
          </h2>
          <div className={s.segmented} role="radiogroup" aria-labelledby="sec-ingredientes">
            <label className={s.segment}>
              <input type="radio" name="descMode" checked={descMode === "ingredientes"} onChange={() => changeDescMode("ingredientes")} />
              <span>Elegir ingredientes</span>
            </label>
            <label className={s.segment}>
              <input type="radio" name="descMode" checked={descMode === "manual"} onChange={() => changeDescMode("manual")} />
              <span>Escribir a mano</span>
            </label>
          </div>

          {descMode === "ingredientes" ? (
            <IngredientPicker value={form.ingredientes} known={knownIngredients} onChange={set("ingredientes")} />
          ) : (
            <label className="field">
              <span className="visually-hidden">Descripción</span>
              <textarea className="input" value={form.descripcion} onChange={onInput("descripcion")} maxLength={600} rows={3} placeholder="Ingredientes, tamaño..." />
              <span className="hint">{form.descripcion.length}/600</span>
            </label>
          )}
        </section>

        <section className={s.formSection} aria-labelledby="sec-precios">
          <h2 id="sec-precios" className={s.h2}>
            Precios
          </h2>

          {usesMeats(form.categoria) ? (
            <label className="field">
              <span>Carnes incluidas en el precio base</span>
              <select className="input" value={meatsValue} onChange={(e) => set("medallones")(Number(e.target.value))}>
                {form.categoria !== "hamburguesas" ? <option value={0}>No lleva carne para elegir</option> : null}
                {Array.from({ length: MAX_BASE_MEATS - MIN_MEATS + 1 }, (_, i) => i + MIN_MEATS).map((n) => (
                  <option key={n} value={n}>
                    {n} ({meatLabel(n)})
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className={s.row2}>
            <label className="field">
              <span>{meatsValue > 0 ? `Precio ${meatLabel(meatsValue).toLowerCase()} ($)` : "Precio ($)"}</span>
              <input className="input" inputMode="numeric" value={form.valor} onChange={numeric("valor")} placeholder="0" required />
            </label>
            {usesMeats(form.categoria) && meatsValue > 0
              ? Object.entries(MEAT_PRICE_KEYS)
                  .filter(([n]) => Number(n) > meatsValue)
                  .map(([n, k]) => (
                    <label key={k} className="field">
                      <span>Precio {meatLabel(Number(n)).toLowerCase()} ($)</span>
                      <input className="input" inputMode="numeric" value={form.precios[k]} onChange={setMeatPrice(k)} placeholder="Automático" />
                    </label>
                  ))
              : null}
          </div>
          {usesMeats(form.categoria) && meatsValue > 0 ? (
            <p className="hint">
              El cliente elige de {meatsValue} a {MAX_MEATS} carnes. Cada precio es el total. Vacío = lo calcula la carta del local.
            </p>
          ) : null}

          <div className={s.toggleBox}>
            <label className={s.check}>
              <input type="checkbox" checked={form.oferta} onChange={onInput("oferta")} />
              <span>En oferta</span>
            </label>
            {form.oferta ? (
              <label className="field">
                <span>Precio de oferta ($)</span>
                <input
                  className="input"
                  inputMode="numeric"
                  value={form.valorOferta}
                  onChange={numeric("valorOferta")}
                  aria-invalid={offerInvalid ? "true" : undefined}
                />
                {offerInvalid ? <span className="error-text">Tiene que ser menor al precio normal.</span> : null}
              </label>
            ) : null}
          </div>

          <label className={s.check}>
            <input type="checkbox" checked={form.oculto} onChange={onInput("oculto")} />
            <span>Ocultar de la carta (sin stock)</span>
          </label>
        </section>
      </div>

      <aside className={s.formSide}>
        <PublishPreview data={{ ...form, descripcion: finalDescripcion }} />
      </aside>

      <div className={s.saveBar}>
        {error ? (
          <p className="error-text" role="alert">
            {error}
          </p>
        ) : null}
        <div className={s.saveActions}>
          {id ? (
            <button type="button" className={s.dangerBtn} onClick={onDelete} disabled={saving}>
              <Trash2 size={18} aria-hidden /> Borrar
            </button>
          ) : null}
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ flex: 1 }}>
            {saving ? "Guardando..." : id ? "Guardar cambios" : "Publicar producto"}
          </button>
        </div>
      </div>
    </form>
  );
}
