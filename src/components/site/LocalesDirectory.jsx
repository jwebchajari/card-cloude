"use client";
import { useState } from "react";
import { Search, X } from "lucide-react";
import LocalCard from "@/components/LocalCard";
import l from "@/app/landing.module.css";
import s from "@/app/pages.module.css";

const PAGE = 20;
const plain = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Todas las tarjetas quedan en el HTML para que los buscadores sigan cada enlace. */
export default function LocalesDirectory({ locales }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const needle = plain(query);
  const matches = locales.filter((x) => !needle || plain(`${x.nombre} ${x.rubro} ${x.ciudad}`).includes(needle));
  const shown = new Set(matches.slice(0, limit).map((x) => x.slug));

  return (
    <>
      <div className={s.search}>
        <Search size={18} aria-hidden />
        <input className="input" type="search" aria-label="Buscar local" placeholder="Nombre, rubro o ciudad" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} />
        {query ? <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQuery("")}><X size={18} aria-hidden /></button> : null}
      </div>
      <p className="hint" role="status">{needle ? `${matches.length} de ${locales.length} locales` : `${locales.length} ${locales.length === 1 ? "local" : "locales"}`}</p>
      {matches.length === 0 ? <p className="hint">No hay locales que coincidan con “{query.trim()}”.</p> : null}
      <ul className={l.locales}>
        {locales.map((x) => <LocalCard key={x.slug} local={x} internal hidden={!shown.has(x.slug)} />)}
      </ul>
      {matches.length > limit ? <button type="button" className={`btn ${s.more}`} onClick={() => setLimit((n) => n + PAGE)}>Ver más locales</button> : null}
    </>
  );
}
