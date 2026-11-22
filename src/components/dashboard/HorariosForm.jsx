"use client";
import { useEffect, useState } from "react";
import { Copy, Plus, X } from "lucide-react";
import Loading from "@/components/Loading";
import { getHorarios, saveHorarios } from "@/lib/admin-data";
import { authError } from "@/lib/session";
import { DAY_LABELS, MAX_FRANJAS, WEEK_ORDER, isHHMM, normalizeHorarios, toMinutes } from "@/utils/horarios";
import { useDashboard } from "./DashboardShell";
import s from "./dashboard.module.css";

export default function HorariosForm() {
  const { local } = useDashboard();
  const [h, setH] = useState(null);
  const [status, setStatus] = useState({ saving: false, msg: "", error: "" });

  useEffect(() => {
    getHorarios(local)
      .then((raw) => {
        const n = normalizeHorarios(raw);
        // Días sin franjas: dejar una vacía lista para completar.
        for (const k of WEEK_ORDER) if (n[k].franjas.length === 0) n[k].franjas = [{ desde: "20:00", hasta: "00:00" }];
        setH(n);
      })
      .catch((e) => setStatus({ saving: false, msg: "", error: authError(e) }));
  }, [local]);

  if (!h) return status.error ? <p className="error-text">{status.error}</p> : <Loading />;

  const update = (k, fn) => setH((prev) => ({ ...prev, [k]: fn(prev[k]) }));

  function copyToAll(from) {
    setH((prev) => {
      const next = { ...prev };
      for (const k of WEEK_ORDER) next[k] = { cerrado: prev[from].cerrado, franjas: prev[from].franjas.map((f) => ({ ...f })) };
      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();
    for (const k of WEEK_ORDER) {
      if (h[k].cerrado) continue;
      for (const f of h[k].franjas) {
        if (!isHHMM(f.desde) || !isHHMM(f.hasta) || f.desde === f.hasta) {
          setStatus({ saving: false, msg: "", error: `Revisá los horarios del ${DAY_LABELS[k].toLowerCase()}.` });
          return;
        }
      }
    }
    setStatus({ saving: true, msg: "", error: "" });
    try {
      await saveHorarios(local, h);
      setStatus({ saving: false, msg: "Horarios guardados.", error: "" });
    } catch (err) {
      setStatus({ saving: false, msg: "", error: authError(err) });
    }
  }

  return (
    <form className={s.stack} onSubmit={submit} noValidate>
      <div>
        <h1 className={s.h1}>Horarios</h1>
        <p className="hint">Si una franja termina después de medianoche (ej: 20:00 a 01:00), se toma como el mismo turno.</p>
      </div>

      {WEEK_ORDER.map((k) => {
        const d = h[k];
        return (
          <fieldset key={k} className={`${s.card} ${s.day}`}>
            <legend className={s.legend}>{DAY_LABELS[k]}</legend>
            <label className={s.check}>
              <input type="checkbox" checked={!d.cerrado} onChange={(e) => update(k, (x) => ({ ...x, cerrado: !e.target.checked }))} />
              <span>{d.cerrado ? "Cerrado" : "Abierto"}</span>
            </label>
            {!d.cerrado ? (
              <>
                {d.franjas.map((f, i) => (
                  <div key={i} className={s.franja}>
                    <label className="field">
                      <span>Desde</span>
                      <input
                        className="input"
                        type="time"
                        value={f.desde}
                        onChange={(e) => update(k, (x) => ({ ...x, franjas: x.franjas.map((y, j) => (j === i ? { ...y, desde: e.target.value } : y)) }))}
                      />
                    </label>
                    <label className="field">
                      <span>Hasta</span>
                      <input
                        className="input"
                        type="time"
                        value={f.hasta}
                        onChange={(e) => update(k, (x) => ({ ...x, franjas: x.franjas.map((y, j) => (j === i ? { ...y, hasta: e.target.value } : y)) }))}
                      />
                    </label>
                    <button
                      type="button"
                      className={s.iconAction}
                      aria-label={`Quitar franja ${i + 1} del ${DAY_LABELS[k].toLowerCase()}`}
                      onClick={() =>
                        update(k, (x) => {
                          const franjas = x.franjas.filter((_, j) => j !== i);
                          return { cerrado: franjas.length === 0, franjas: franjas.length ? franjas : [{ desde: "20:00", hasta: "00:00" }] };
                        })
                      }
                    >
                      <X size={18} aria-hidden />
                    </button>
                    {isHHMM(f.desde) && isHHMM(f.hasta) && toMinutes(f.hasta) <= toMinutes(f.desde) && f.desde !== f.hasta ? (
                      <span className={`hint ${s.franjaNote}`}>Cierra al día siguiente</span>
                    ) : null}
                  </div>
                ))}
                <div className={s.dayActions}>
                  {d.franjas.length < MAX_FRANJAS ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => update(k, (x) => ({ ...x, franjas: [...x.franjas, { desde: "12:00", hasta: "15:00" }] }))}
                    >
                      <Plus size={18} aria-hidden /> Otra franja
                    </button>
                  ) : null}
                  <button type="button" className="btn btn-ghost" onClick={() => copyToAll(k)}>
                    <Copy size={18} aria-hidden /> Copiar a todos
                  </button>
                </div>
              </>
            ) : null}
          </fieldset>
        );
      })}

      <div className={s.saveBar}>
        {status.error ? (
          <p className="error-text" role="alert">
            {status.error}
          </p>
        ) : null}
        {status.msg ? (
          <p className={s.ok} role="status">
            {status.msg}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={status.saving}>
          {status.saving ? "Guardando..." : "Guardar horarios"}
        </button>
      </div>
    </form>
  );
}
