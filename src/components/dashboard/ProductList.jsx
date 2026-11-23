"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { onValue, ref } from "firebase/database";
import { Eye, EyeOff, Pencil, Plus } from "lucide-react";
import Loading from "@/components/Loading";
import ProductImage from "@/components/menu/ProductImage";
import { Price } from "@/components/menu/ProductRow";
import { setComidaFlag } from "@/lib/admin-data";
import { getDb } from "@/lib/firebase";
import { groupByCategory, normalizeProducts } from "@/lib/menu-shared";
import { useDashboard } from "./DashboardShell";
import VisitStats from "./VisitStats";
import s from "./dashboard.module.css";

export default function ProductList() {
  const { local } = useDashboard();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return onValue(
      ref(getDb(), `locales/${local}/comidas`),
      (snap) => setProducts(normalizeProducts(snap.val())),
      () => setError("No pudimos leer los productos.")
    );
  }, [local]);

  if (error) return <p className="error-text">{error}</p>;
  if (!products) return <Loading />;

  const groups = groupByCategory(products, { hidden: true });

  return (
    <div className={s.stack}>
      <div className={s.headRow}>
        <h1 className={s.h1}>Productos</h1>
        <Link href={`/panel/${local}/agregar`} className="btn btn-primary">
          <Plus size={18} aria-hidden /> Agregar
        </Link>
      </div>

      {products.length === 0 ? (
        <div className={s.card}>
          <p>Todavía no cargaste productos.</p>
          <p className="hint">Empezá por tus productos principales: nombre, precio y una buena foto.</p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.id} aria-labelledby={`dh-${g.id}`}>
            <h2 id={`dh-${g.id}`} className={s.h2}>
              {g.label} <small>({g.items.length})</small>
            </h2>
            <ul className={s.plist}>
              {g.items.map((p) => (
                <li key={p.id} className={`${s.pitem} ${p.oculto ? s.pitemHidden : ""}`}>
                  <ProductImage src={p.imagen} alt="" width={160} className={s.pimg} />
                  <div className={s.pinfo}>
                    <p className={s.pname}>{p.nombre}</p>
                    <div className={s.pmeta}>
                      <Price product={p} />
                      {p.oferta ? <span className={s.tag}>Oferta</span> : null}
                      {p.oculto ? <span className={s.tagMuted}>Oculto</span> : null}
                    </div>
                  </div>
                  <div className={s.pactions}>
                    <button
                      type="button"
                      className={s.iconAction}
                      onClick={() => setComidaFlag(local, p.id, { oculto: !p.oculto }).catch(() => setError("No se pudo actualizar."))}
                      aria-label={p.oculto ? `Mostrar ${p.nombre}` : `Ocultar ${p.nombre}`}
                      title={p.oculto ? "Mostrar en la carta" : "Ocultar de la carta"}
                    >
                      {p.oculto ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
                    </button>
                    <Link href={`/panel/${local}/editar/${p.id}`} className={s.iconAction} aria-label={`Editar ${p.nombre}`}>
                      <Pencil size={20} aria-hidden />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <VisitStats local={local} />
    </div>
  );
}
