"use client";
import { useState } from "react";
import { CalendarClock, Store } from "lucide-react";
import DatosForm from "./DatosForm";
import HorariosForm from "./HorariosForm";
import s from "./dashboard.module.css";

/** Datos y horarios en una sola sección. Ambos quedan montados para no perder lo escrito al cambiar. */
export default function DatosLocal() {
  const [tab, setTab] = useState(() => (typeof window !== "undefined" && window.location.hash === "#horarios" ? "horarios" : "info"));

  return (
    <div className={s.stack}>
      <h1 className={s.h1}>Datos del local</h1>
      <div className={s.segmented} role="radiogroup" aria-label="Sección">
        <label className={s.segment}>
          <input type="radio" name="datos-local" checked={tab === "info"} onChange={() => setTab("info")} />
          <span><Store size={16} aria-hidden /> Información</span>
        </label>
        <label className={s.segment}>
          <input type="radio" name="datos-local" checked={tab === "horarios"} onChange={() => setTab("horarios")} />
          <span><CalendarClock size={16} aria-hidden /> Horarios</span>
        </label>
      </div>
      <div hidden={tab !== "info"}><DatosForm /></div>
      <div hidden={tab !== "horarios"}><HorariosForm /></div>
    </div>
  );
}
