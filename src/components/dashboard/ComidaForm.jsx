"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import Loading from "@/components/Loading";
import { deleteComida, getComida, getComidas, saveComida } from "@/lib/admin-data";
import { authError } from "@/lib/session";
import { CATEGORIES, DEFAULT_VERSION_BASE, MAX_BASE_MEATS, MAX_CATEGORY_NAME, MAX_MEATS, MAX_PACKS, MAX_PACK_QTY, MAX_VERSIONS, MAX_VERSION_NAME, MEAT_PRICE_KEYS, MIN_MEATS, cleanIngredients, cleanPacks, cleanVersions, customCategories, hasIngredients, ingredientsText, isCommonCategory, meatLabel, packKey, productPacks, slugText, usesMeats } from "@/lib/catalogo";
import { useDashboard } from "./DashboardShell";
import ImageUploader from "./ImageUploader";
import IngredientPicker from "./IngredientPicker";
import PublishPreview from "./PublishPreview";
import s from "./dashboard.module.css";

const NEW_CATEGORY = "__nueva__";
const DEFAULT_PACKS = [1, 6, 12].map((n) => ({ cantidad: String(n), precio: "" }));
const DEFAULT_VERSIONS = [{ nombre: "", precio: "" }];

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
  const [knownCategories, setKnownCategories] = useState([]);
  const [writingCategory, setWritingCategory] = useState(false);
  const [sellByPack, setSellByPack] = useState(false);
  const [packRows, setPackRows] = useState(DEFAULT_PACKS);
  const [hasVersions, setHasVersions] = useState(false);
  const [versionBase, setVersionBase] = useState("");
  const [versionRows, setVersionRows] = useState(DEFAULT_VERSIONS);

  // Los ingredientes y las categorías de otros productos del local se pueden volver a elegir.
  useEffect(() => {
    let alive = true;
    getComidas(local)
      .then((all) => {
        if (!alive) return;
        const items = Object.values(all);
        setKnownIngredients(items.map((p) => p?.ingredientes).filter(Boolean));
        setKnownCategories(items.map((p) => p?.categoria));
      })
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
        const versions = cleanVersions(c.distinciones);
        if (versions.length) {
          setHasVersions(true);
          setVersionBase(c.distincionBase || "");
          setVersionRows(versions.map((v) => ({ nombre: v.nombre, precio: String(v.precio) })));
        }
        const packs = productPacks(c);
        if (packs.length) {
          setSellByPack(true);
          setPackRows(packs.map((p) => ({ cantidad: String(p.cantidad), precio: String(p.precio) })));
        }
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

  // Una categoría propia solo muestra carnes si el producto ya las tenía.
  const showMeats = !sellByPack && usesMeats(form.categoria) && (isCommonCategory(form.categoria) || rawMeats > 0);
  const ownCategories = customCategories(writingCategory ? knownCategories : [form.categoria, ...knownCategories]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const onInput = (k) => (e) => set(k)(e.target.type === "checkbox" ? e.target.checked : e.target.value);
  const numeric = (k) => (e) => set(k)(e.target.value.replace(/\D/g, "").slice(0, 9));
  const setMeatPrice = (k) => (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 9);
    setForm((f) => ({ ...f, precios: { ...f.precios, [k]: value } }));
  };

  // Una fila sin precio se ignora: así se puede vender solo x6 y x12.
  const packEntries = sellByPack ? packRows.filter((r) => r.precio) : [];
  const packsIncomplete = packEntries.some((r) => !(Number(r.cantidad) >= 1 && Number(r.cantidad) <= MAX_PACK_QTY && Number(r.precio) > 0));
  const packsRepeated = new Set(packEntries.map((r) => Number(r.cantidad))).size !== packEntries.length;
  const presentaciones = packsIncomplete ? {} : cleanPacks(Object.fromEntries(packEntries.map((r) => [packKey(Number(r.cantidad)), Number(r.precio)])));
  const setPackRow = (i, k) => (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, k === "cantidad" ? 3 : 9);
    setPackRows((rows) => rows.map((r, n) => (n === i ? { ...r, [k]: value } : r)));
  };

  // Una fila vacía se ignora. Una a medio completar frena el guardado.
  const versionEntries = hasVersions && !sellByPack ? versionRows.filter((r) => r.nombre.trim() || r.precio) : [];
  const versionsIncomplete = versionEntries.some((r) => !r.nombre.trim() || !(Number(r.precio) > 0));
  const versiones = versionsIncomplete ? [] : cleanVersions(versionEntries.map((r) => ({ nombre: r.nombre, precio: Number(r.precio) })));
  const setVersionRow = (i, k) => (e) => {
    const value = k === "precio" ? e.target.value.replace(/\D/g, "").slice(0, 9) : e.target.value.slice(0, MAX_VERSION_NAME);
    setVersionRows((rows) => rows.map((r, n) => (n === i ? { ...r, [k]: value } : r)));
  };

  const offerInvalid = !sellByPack && form.oferta && !(Number(form.valorOferta) > 0 && Number(form.valorOferta) < Number(form.valor));

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
    if (!form.categoria.trim()) return setError("Escribí el nombre de la categoría.");
    if (sellByPack) {
      if (packsIncomplete) return setError(`Cada precio necesita una cantidad entre 1 y ${MAX_PACK_QTY}.`);
      if (packsRepeated) return setError("Hay una cantidad repetida.");
      if (!packEntries.length) return setError("Poné el precio de al menos una cantidad.");
    } else if (!(Number(form.valor) > 0)) return setError("Poné un precio mayor a 0.");
    if (versionsIncomplete) return setError("Cada versión necesita nombre y precio.");
    if (versionEntries.length && versiones.length !== versionEntries.length) return setError("Hay una versión repetida.");
    if (offerInvalid) return setError("El precio de oferta tiene que ser menor al precio normal.");
    if (finalDescripcion.length > 600) return setError("Los ingredientes superan los 600 caracteres. Quitá alguno.");
    setSaving(true);
    setError("");
    // Si ya existe con otra escritura se reutiliza, así no quedan dos secciones iguales.
    const categoria = ownCategories.find((c) => slugText(c) === slugText(form.categoria)) || form.categoria;
    try {
      await saveComida(
        local,
        id,
        { ...form, categoria, presentaciones: sellByPack ? presentaciones : null, oferta: sellByPack ? false : form.oferta, medallones: sellByPack ? 0 : meatsValue, descripcion: finalDescripcion, ingredientes: usesIngredients ? form.ingredientes : null, distinciones: versiones, distincionBase: versionBase },
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
          <div className={s.stack}>
            <label className="field">
              <span>Categoría</span>
              <select
                className="input"
                value={writingCategory ? NEW_CATEGORY : form.categoria}
                onChange={(e) => {
                  const value = e.target.value;
                  const writing = value === NEW_CATEGORY;
                  const categoria = writing ? "" : value;
                  setWritingCategory(writing);
                  setForm((f) => ({ ...f, categoria, medallones: categoria === "hamburguesas" ? Math.max(1, Number(f.medallones) || 0) : 0 }));
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
                {ownCategories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value={NEW_CATEGORY}>Escribir otra categoría...</option>
              </select>
            </label>
            {writingCategory ? (
              <label className="field">
                <span>Nombre de la categoría</span>
                <input
                  className="input"
                  value={form.categoria}
                  onChange={onInput("categoria")}
                  maxLength={MAX_CATEGORY_NAME}
                  placeholder="Ej: Churros rellenos"
                  autoFocus
                  required
                />
              </label>
            ) : null}
          </div>
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

          <div className={s.segmented} role="radiogroup" aria-label="Forma de venta">
            <label className={s.segment}>
              <input type="radio" name="sellMode" checked={!sellByPack} onChange={() => setSellByPack(false)} />
              <span>Precio único</span>
            </label>
            <label className={s.segment}>
              <input type="radio" name="sellMode" checked={sellByPack} onChange={() => setSellByPack(true)} />
              <span>Por cantidad</span>
            </label>
          </div>

          {sellByPack ? (
            <div className={s.stack}>
              {packRows.map((row, i) => (
                <div key={i} className={s.packRow}>
                  <label className="field">
                    <span>Cantidad</span>
                    <input className="input" inputMode="numeric" value={row.cantidad} onChange={setPackRow(i, "cantidad")} placeholder="6" />
                  </label>
                  <label className="field">
                    <span>Precio total ($)</span>
                    <input className="input" inputMode="numeric" value={row.precio} onChange={setPackRow(i, "precio")} placeholder="0" />
                  </label>
                  <button
                    type="button"
                    className={s.iconAction}
                    onClick={() => setPackRows((rows) => rows.filter((_, n) => n !== i))}
                    aria-label={`Quitar cantidad ${row.cantidad || i + 1}`}
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                </div>
              ))}
              {packRows.length < MAX_PACKS ? (
                <button type="button" className="btn btn-ghost" onClick={() => setPackRows((rows) => [...rows, { cantidad: "", precio: "" }])}>
                  <Plus size={18} aria-hidden /> Agregar cantidad
                </button>
              ) : null}
              <p className="hint">Cada precio es el total de esa cantidad. Dejá vacío lo que no vendas.</p>
            </div>
          ) : (
            <>
          {showMeats ? (
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
            {showMeats && meatsValue > 0
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
          {showMeats && meatsValue > 0 ? (
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

          <div className={s.toggleBox}>
            <label className={s.check}>
              <input type="checkbox" checked={hasVersions} onChange={(e) => setHasVersions(e.target.checked)} />
              <span>Tiene distinciones con otro precio (veggie, sin TACC...)</span>
            </label>
            {hasVersions ? (
              <div className={s.stack}>
                <label className="field">
                  <span>Nombre de la versión del precio de arriba</span>
                  <input className="input" value={versionBase} onChange={(e) => setVersionBase(e.target.value.slice(0, MAX_VERSION_NAME))} placeholder={DEFAULT_VERSION_BASE} />
                </label>
                {versionRows.map((row, i) => (
                  <div key={i} className={s.packRow}>
                    <label className="field">
                      <span>Versión</span>
                      <input className="input" value={row.nombre} onChange={setVersionRow(i, "nombre")} placeholder="Veggie" />
                    </label>
                    <label className="field">
                      <span>Precio ($)</span>
                      <input className="input" inputMode="numeric" value={row.precio} onChange={setVersionRow(i, "precio")} placeholder="0" />
                    </label>
                    <button
                      type="button"
                      className={s.iconAction}
                      onClick={() => setVersionRows((rows) => rows.filter((_, n) => n !== i))}
                      aria-label={`Quitar versión ${row.nombre || i + 1}`}
                    >
                      <Trash2 size={18} aria-hidden />
                    </button>
                  </div>
                ))}
                {versionRows.length < MAX_VERSIONS ? (
                  <button type="button" className="btn btn-ghost" onClick={() => setVersionRows((rows) => [...rows, { nombre: "", precio: "" }])}>
                    <Plus size={18} aria-hidden /> Agregar versión
                  </button>
                ) : null}
                <p className="hint">Cada precio es el de esa versión con la carne base. Las carnes extra suman lo mismo que en la versión de arriba.</p>
              </div>
            ) : null}
          </div>
            </>
          )}

          <label className={s.check}>
            <input type="checkbox" checked={form.oculto} onChange={onInput("oculto")} />
            <span>Ocultar de la carta (sin stock)</span>
          </label>
        </section>
      </div>

      <div className={s.formSideCol}>
      <aside className={s.formSide}>
        <PublishPreview data={{ ...form, presentaciones: sellByPack ? presentaciones : null, descripcion: finalDescripcion }} />
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
      </div>
    </form>
  );
}
