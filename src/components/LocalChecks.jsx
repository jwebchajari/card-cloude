"use client";
import s from "./panel.module.css";

export default function LocalChecks({ locales, value, onChange }) {
  if (!locales.length) return <p className="hint">Primero creá un local.</p>;
  return (
    <fieldset className={s.checks}>
      <legend>Locales</legend>
      {locales.map((l) => (
        <label key={l.slug}>
          <input type="checkbox" checked={value.includes(l.slug)} onChange={(e) => onChange(e.target.checked ? [...value, l.slug] : value.filter((x) => x !== l.slug))} />
          {l.slug}
        </label>
      ))}
    </fieldset>
  );
}
