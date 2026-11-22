"use client";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { INGREDIENT_CATALOG, INGREDIENT_GROUPS, cleanIngredients, ingredientKey, ingredientsText, sortIngredientNames } from "@/lib/catalogo";
import s from "./dashboard.module.css";

const capitalize = (t) => t.charAt(0).toLocaleUpperCase("es") + t.slice(1);

/** Píldoras por grupo. `known` trae los ingredientes ya usados en otros productos del local. */
export default function IngredientPicker({ value, known = [], onChange }) {
  const [added, setAdded] = useState({});
  const [drafts, setDrafts] = useState({});
  const [adding, setAdding] = useState(null);
  const text = ingredientsText(value);

  function optionsFor(group) {
    // El catálogo va primero: si hay repetidos, gana su forma de escribirlo.
    return sortIngredientNames([
      ...INGREDIENT_CATALOG[group],
      ...known.flatMap((k) => cleanIngredients(k)[group]),
      ...(added[group] || []),
      ...value[group],
    ]);
  }

  function toggle(group, name) {
    const key = ingredientKey(name);
    const on = value[group].some((n) => ingredientKey(n) === key);
    const next = on ? value[group].filter((n) => ingredientKey(n) !== key) : [...value[group], name];
    onChange(cleanIngredients({ ...value, [group]: next }));
  }

  function addCustom(group) {
    const raw = (drafts[group] || "").trim().replace(/\s+/g, " ");
    if (!raw) return;
    const key = ingredientKey(raw);
    const name = optionsFor(group).find((n) => ingredientKey(n) === key) || capitalize(raw);
    setAdded((a) => ({ ...a, [group]: [...(a[group] || []), name] }));
    setDrafts((d) => ({ ...d, [group]: "" }));
    setAdding(null);
    if (!value[group].some((n) => ingredientKey(n) === key)) onChange(cleanIngredients({ ...value, [group]: [...value[group], name] }));
  }

  return (
    <div className={s.ingredients}>
      {INGREDIENT_GROUPS.map(({ id, label }) => (
        <div key={id} className={s.ingredientGroup} role="group" aria-labelledby={`ing-${id}`}>
          <span id={`ing-${id}`} className="label">
            {label}
          </span>
          <div className={s.pills}>
            {optionsFor(id).map((name) => {
              const on = value[id].some((n) => ingredientKey(n) === ingredientKey(name));
              return (
                <button
                  key={name}
                  type="button"
                  className={`${s.pill} ${on ? s.pillOn : ""}`}
                  aria-pressed={on}
                  onClick={() => toggle(id, name)}
                >
                  {on ? <Check size={15} aria-hidden /> : null}
                  {name}
                </button>
              );
            })}
            <button
              type="button"
              className={`${s.pill} ${s.pillAdd}`}
              aria-expanded={adding === id}
              aria-label={`Agregar otro ingrediente a ${label}`}
              onClick={() => setAdding((a) => (a === id ? null : id))}
            >
              <Plus size={15} aria-hidden /> Otro
            </button>
          </div>
          {adding === id ? (
            <div className={s.linkRow}>
              <input
                className="input"
                autoFocus
                value={drafts[id] || ""}
                maxLength={40}
                placeholder="Nombre del ingrediente"
                aria-label={`Nombre del ingrediente nuevo para ${label}`}
                onChange={(e) => setDrafts((d) => ({ ...d, [id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setAdding(null);
                  }
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  addCustom(id);
                }}
              />
              <button type="button" className="btn btn-ghost" onClick={() => addCustom(id)}>
                <Plus size={18} aria-hidden /> Agregar
              </button>
            </div>
          ) : null}
        </div>
      ))}
      <p className="hint" aria-live="polite">
        {text ? `Se muestra así: ${text}` : "Elegí los ingredientes. Se ordenan solos: pan, carne y aderezos de la A a la Z."}
      </p>
    </div>
  );
}
