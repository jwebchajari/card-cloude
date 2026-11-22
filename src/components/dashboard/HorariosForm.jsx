"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Copy, Plus, X } from "lucide-react";
import Loading from "@/components/Loading";
import { getHorarios, saveHorarios } from "@/lib/admin-data";
import { authError } from "@/lib/session";
import { DAY_LABELS, MAX_FRANJAS, WEEK_ORDER, franjasText, isHHMM, normalizeHorarios, toMinutes } from "@/utils/horarios";
import { useDashboard } from "./DashboardShell";
import dash from "./dashboard.module.css";
import s from "./horarios.module.css";

const DEFAULT_FRANJA = { desde: "20:00", hasta: "00:00" };
const DAY_SHORT = { lunes: "Lun", martes: "Mar", miercoles: "Mié", jueves: "Jue", viernes: "Vie", sabado: "Sáb", domingo: "Dom" };
const WEEKDAYS = ["lunes", "martes", "miercoles", "jueves", "viernes"];
const SHORTCUTS = [
  ["Lun a Vie", WEEKDAYS],
  ["Fin de semana", ["sabado", "domingo"]],
  ["Todos", WEEK_ORDER],
];

const copyFranjas = (list) => list.map((f) => ({ desde: f.desde, hasta: f.hasta }));
const validFranjas = (list) => list.length > 0 && list.every((f) => isHHMM(f.desde) && isHHMM(f.hasta) && f.desde !== f.hasta);
const sameDays = (a, b) => a.length === b.length && b.every((d) => a.includes(d));
const daysText = (n) => `${n} ${n === 1 ? "día" : "días"}`;

function cleanWeek(week) {
  return Object.fromEntries(WEEK_ORDER.map((k) => [k, week[k].cerrado ? { cerrado: true, franjas: [] } : { cerrado: false, franjas: copyFranjas(week[k].franjas) }]));
}

function FranjasEditor({ franjas, onChange, name }) {
  const patch = (i, key, value) => onChange(franjas.map((f, j) => (j === i ? { ...f, [key]: value } : f)));
  return (
    <div className={s.franjas}>
      {franjas.map((f, i) => (
        <div key={i} className={s.franja}>
          <label className="field">
            <span>Desde</span>
            <input className="input" type="time" value={f.desde} onChange={(e) => patch(i, "desde", e.target.value)} />
          </label>
          <label className="field">
            <span>Hasta</span>
            <input className="input" type="time" value={f.hasta} onChange={(e) => patch(i, "hasta", e.target.value)} />
          </label>
          <button type="button" className={s.remove} disabled={franjas.length === 1} aria-label={`Quitar turno ${i + 1} de ${name}`} onClick={() => onChange(franjas.filter((_, j) => j !== i))}>
            <X size={18} aria-hidden />
          </button>
          {isHHMM(f.desde) && isHHMM(f.hasta) && f.desde !== f.hasta && toMinutes(f.hasta) <= toMinutes(f.desde) ? <span className={`hint ${s.note}`}>Cierra al día siguiente</span> : null}
        </div>
      ))}
      {franjas.length < MAX_FRANJAS ? (
        <button type="button" className={`btn ${s.addTurn}`} onClick={() => onChange([...franjas, { desde: "12:00", hasta: "15:00" }])}>
          <Plus size={18} aria-hidden /> Agregar turno
        </button>
      ) : null}
    </div>
  );
}

export function HorariosEditor({ initial, onSave }) {
  const [week, setWeek] = useState(() => cleanWeek(initial));
  const [baseline, setBaseline] = useState(() => JSON.stringify(cleanWeek(initial)));
  const [days, setDays] = useState(WEEKDAYS);
  const [bulk, setBulk] = useState(() => {
    const first = WEEK_ORDER.find((k) => !initial[k].cerrado && initial[k].franjas.length);
    return first ? copyFranjas(initial[first].franjas) : [{ ...DEFAULT_FRANJA }];
  });
  const [openDay, setOpenDay] = useState(null);
  const [notice, setNotice] = useState("");
  const [status, setStatus] = useState({ saving: false, msg: "", error: "" });
  const bulkRef = useRef(null);
  const clean = cleanWeek(week);
  const dirty = JSON.stringify(clean) !== baseline;

  const updateDay = (k, patch) => {
    setStatus((x) => ({ ...x, msg: "" }));
    setWeek((prev) => ({ ...prev, [k]: { ...prev[k], ...patch } }));
  };
  const toggleBulkDay = (k) => setDays((prev) => (prev.includes(k) ? prev.filter((d) => d !== k) : WEEK_ORDER.filter((d) => prev.includes(d) || d === k)));

  function toggleOpen(k, open) {
    updateDay(k, open ? { cerrado: false, franjas: week[k].franjas.length ? week[k].franjas : copyFranjas(bulk) } : { cerrado: true });
    setOpenDay(open ? k : openDay === k ? null : openDay);
  }

  function applyBulk(cerrado) {
    if (!days.length) return setNotice("Elegí al menos un día.");
    if (!cerrado && !validFranjas(bulk)) return setNotice("Revisá los horarios: inicio y cierre tienen que ser distintos.");
    setStatus((x) => ({ ...x, msg: "", error: "" }));
    setWeek((prev) => {
      const next = { ...prev };
      for (const k of days) next[k] = cerrado ? { cerrado: true, franjas: [] } : { cerrado: false, franjas: copyFranjas(bulk) };
      return next;
    });
    return setNotice(`${cerrado ? "Cerraste" : "Aplicaste el horario a"} ${daysText(days.length)}. Falta guardar.`);
  }

  function copyDayToBulk(k) {
    setBulk(copyFranjas(week[k].franjas));
    setDays([k]);
    setNotice(`Copiaste ${DAY_LABELS[k].toLowerCase()}. Elegí los otros días y aplicá.`);
    bulkRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submit(e) {
    e.preventDefault();
    const wrong = WEEK_ORDER.find((k) => !clean[k].cerrado && !validFranjas(clean[k].franjas));
    if (wrong) {
      setOpenDay(wrong);
      setStatus({ saving: false, msg: "", error: `Revisá los horarios del ${DAY_LABELS[wrong].toLowerCase()}.` });
      return;
    }
    setStatus({ saving: true, msg: "", error: "" });
    try {
      await onSave(clean);
      setBaseline(JSON.stringify(clean));
      setNotice("");
      setStatus({ saving: false, msg: "Horarios guardados.", error: "" });
    } catch (err) {
      setStatus({ saving: false, msg: "", error: authError(err) });
    }
  }

  return (
    <form className={dash.stack} onSubmit={submit} noValidate>
      <section ref={bulkRef} className={s.bulk} aria-labelledby="horario-rapido">
        <div>
          <h2 id="horario-rapido">Cargar varios días a la vez</h2>
          <p className="hint">Elegí los días, poné el horario y aplicalo.</p>
        </div>

        <div className={s.shortcuts}>
          {SHORTCUTS.map(([label, list]) => (
            <button key={label} type="button" aria-pressed={sameDays(days, list)} onClick={() => setDays(list)}>{label}</button>
          ))}
        </div>

        <fieldset className={s.dayPicker}>
          <legend className="visually-hidden">Días a modificar</legend>
          {WEEK_ORDER.map((k) => (
            <label key={k} title={DAY_LABELS[k]}>
              <input type="checkbox" checked={days.includes(k)} onChange={() => toggleBulkDay(k)} aria-label={DAY_LABELS[k]} />
              <span aria-hidden>{DAY_SHORT[k]}</span>
            </label>
          ))}
        </fieldset>

        <FranjasEditor franjas={bulk} onChange={setBulk} name="los días elegidos" />

        <div className={s.bulkActions}>
          <button type="button" className="btn btn-primary" disabled={!days.length} onClick={() => applyBulk(false)}>Aplicar a {daysText(days.length)}</button>
          <button type="button" className="btn" disabled={!days.length} onClick={() => applyBulk(true)}>Marcar cerrado</button>
        </div>
        {notice ? <p className={s.notice} role="status">{notice}</p> : null}
      </section>

      <section aria-labelledby="semana">
        <h2 id="semana" className={s.weekTitle}>Tu semana</h2>
        <ul className={s.week}>
          {WEEK_ORDER.map((k) => {
            const d = week[k];
            const expanded = openDay === k && !d.cerrado;
            return (
              <li key={k}>
                <div className={s.dayHead}>
                  <label className={s.switch}>
                    <input type="checkbox" role="switch" checked={!d.cerrado} onChange={(e) => toggleOpen(k, e.target.checked)} aria-label={`${DAY_LABELS[k]} abierto`} />
                    <span aria-hidden />
                  </label>
                  <button type="button" className={s.dayToggle} disabled={d.cerrado} aria-expanded={expanded} onClick={() => setOpenDay(expanded ? null : k)}>
                    <strong>{DAY_LABELS[k]}</strong>
                    <small>{franjasText(clean[k])}</small>
                    {d.cerrado ? null : <ChevronDown size={18} aria-hidden />}
                  </button>
                </div>
                {expanded ? (
                  <div className={s.dayBody}>
                    <FranjasEditor franjas={d.franjas} onChange={(franjas) => updateDay(k, { franjas })} name={DAY_LABELS[k].toLowerCase()} />
                    <button type="button" className="btn" onClick={() => copyDayToBulk(k)}><Copy size={18} aria-hidden /> Copiar a otros días</button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        <p className={`hint ${s.footnote}`}>Si un turno termina después de medianoche, por ejemplo de 20:00 a 01:00, se toma como el mismo turno.</p>
      </section>

      {dirty || status.msg || status.error ? (
        <div className={dash.saveBar}>
          {status.error ? <p className="error-text" role="alert">{status.error}</p> : null}
          {status.msg ? <p className={dash.ok} role="status">{status.msg}</p> : null}
          {dirty ? (
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={status.saving}>
              {status.saving ? "Guardando..." : "Guardar horarios"}
            </button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

export default function HorariosForm() {
  const { local } = useDashboard();
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getHorarios(local)
      .then((raw) => alive && setLoaded({ local, horarios: normalizeHorarios(raw) }))
      .catch((e) => alive && setError(authError(e)));
    return () => {
      alive = false;
    };
  }, [local]);

  if (error) return <p className="error-text">{error}</p>;
  if (loaded?.local !== local) return <Loading />;
  return <HorariosEditor key={local} initial={loaded.horarios} onSave={(value) => saveHorarios(local, value)} />;
}
