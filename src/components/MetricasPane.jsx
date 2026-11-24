"use client";

import { useEffect, useState } from "react";
import { getMetricasSitio } from "@/lib/admin-data";
import { lastDays } from "./dashboard/VisitStats";
import s from "./dashboard/dashboard.module.css";

function summary(serie) {
  const days = lastDays(14).map((d) => ({ ...d, n: Number(serie?.dias?.[d.key]) || 0 }));
  return {
    days,
    today: days[days.length - 1].n,
    week: days.slice(-7).reduce((a, d) => a + d.n, 0),
    total: Number(serie?.total) || 0,
  };
}

function Serie({ id, title, unit, hint, data }) {
  const max = Math.max(1, ...data.days.map((d) => d.n));
  return (
    <section className={s.stats} aria-labelledby={id}>
      <h2 id={id} className={s.h2}>{title}</h2>
      <div className={s.kpis}>
        <div><span>Hoy</span><strong>{data.today}</strong></div>
        <div><span>Últimos 7 días</span><strong>{data.week}</strong></div>
        <div><span>Total</span><strong>{data.total}</strong></div>
      </div>
      <ol className={s.bars} aria-label={`${title}, últimos 14 días`}>
        {data.days.map((d) => (
          <li key={d.key} title={`${d.label}: ${d.n}`}>
            <span className={s.bar} style={{ height: `${(d.n / max) * 100}%` }} />
            <span className="visually-hidden">{d.label}: {d.n} {unit}</span>
          </li>
        ))}
      </ol>
      <p className="hint">{hint}</p>
    </section>
  );
}

export function MetricasView({ data }) {
  const visitas = summary(data.visitas);
  const whatsapp = summary(data.whatsapp);
  const rate = visitas.week ? ((whatsapp.week / visitas.week) * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 }) : "0";

  return (
    <div>
      <section className={s.stats} aria-labelledby="h-conversion">
        <h2 id="h-conversion" className={s.h2}>Conversión a WhatsApp</h2>
        <div className={s.kpis}>
          <div><span>Últimos 7 días</span><strong>{rate}%</strong></div>
        </div>
        <p className="hint">De cada 100 visitas, cuántas tocaron Consultar precio por WhatsApp.</p>
      </section>
      <Serie id="h-sitio-visitas" title="Visitas a la web" unit="visitas" hint="Una por sesión de navegador. No cuenta bots ni navegadores que entraron al panel." data={visitas} />
      <Serie id="h-sitio-whatsapp" title="Clics en Consultar precio" unit="clics" hint="Mide quién abrió WhatsApp, no si llegó a enviar el mensaje." data={whatsapp} />
    </div>
  );
}

export default function MetricasPane() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMetricasSitio()
      .then(setData)
      .catch((err) => setError(err.message === "admin/not-configured" ? "Faltan las credenciales de Firebase en el servidor." : "No se pudieron cargar las métricas."));
  }, []);

  if (error) return <p className="error-text" role="alert">{error}</p>;
  if (!data) return <p role="status">Cargando...</p>;
  return <MetricasView data={data} />;
}
