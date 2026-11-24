"use client";
import { useEffect, useState } from "react";
import { getVisitas } from "@/lib/admin-data";
import { TIMEZONE } from "@/lib/catalogo";
import s from "./dashboard.module.css";

export function lastDays(n) {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });
  const label = new Intl.DateTimeFormat("es-AR", { timeZone: TIMEZONE, weekday: "short", day: "numeric" });
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    out.push({ key: fmt.format(d), label: label.format(d) });
  }
  return out;
}

export default function VisitStats({ local }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getVisitas(local)
      .then(setData)
      .catch(() => setData({ total: 0, dias: {} }));
  }, [local]);

  if (!data) return null;
  const days = lastDays(14).map((d) => ({ ...d, n: Number(data.dias?.[d.key]) || 0 }));
  const max = Math.max(1, ...days.map((d) => d.n));
  const today = days[days.length - 1].n;
  const week = days.slice(-7).reduce((a, d) => a + d.n, 0);

  return (
    <section className={s.stats} aria-labelledby="h-visitas">
      <h2 id="h-visitas" className={s.h2}>
        Visitas a la carta
      </h2>
      <div className={s.kpis}>
        <div>
          <span>Hoy</span>
          <strong>{today}</strong>
        </div>
        <div>
          <span>Últimos 7 días</span>
          <strong>{week}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>{Number(data.total) || 0}</strong>
        </div>
      </div>
      <ol className={s.bars} aria-label="Visitas por día, últimos 14 días">
        {days.map((d) => (
          <li key={d.key} title={`${d.label}: ${d.n}`}>
            <span className={s.bar} style={{ height: `${(d.n / max) * 100}%` }} />
            <span className="visually-hidden">
              {d.label}: {d.n} visitas
            </span>
          </li>
        ))}
      </ol>
      <p className="hint">Una visita por sesión de navegador. Últimos 14 días.</p>
    </section>
  );
}
