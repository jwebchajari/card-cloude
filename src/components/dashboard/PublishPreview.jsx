"use client";
import { normalizeProduct } from "@/lib/menu-shared";
import { fotoForma } from "@/lib/catalogo";
import ProductImage from "@/components/menu/ProductImage";
import { Price } from "@/components/menu/ProductRow";
import m from "@/components/menu/menu.module.css";
import { useDashboard } from "./DashboardShell";
import s from "./dashboard.module.css";

/** Vista previa del producto tal como se verá en la carta, con la forma de foto de ese local. */
export default function PublishPreview({ data }) {
  const { ficha } = useDashboard() || {};
  const forma = fotoForma(ficha?.fotoForma);
  const p = normalizeProduct("preview", data);
  return (
    <div className={s.preview} aria-label="Vista previa en la carta">
      <p className={s.previewLabel}>
        Así se ve en la carta{p.oculto ? " (oculto)" : ""}
        <span className={s.previewShape}>Foto {forma.label.toLowerCase()}</span>
      </p>
      <div className={`${m.row} ${s.previewRow}`} style={{ opacity: p.oculto ? 0.5 : 1 }}>
        <div className={m.rowText}>
          <p className={m.rowName}>{p.nombre}</p>
          {p.descripcion ? <p className={m.rowDesc}>{p.descripcion}</p> : null}
          <div className={m.rowMeta}>
            <Price product={p} />
            {p.oferta ? <span className={m.badge}>Oferta</span> : null}
          </div>
        </div>
        <ProductImage src={p.imagen} alt="" width={320} ratio={forma.ratio} className={`${m.rowImg} ${s.shapeImg} ${s[`shape_${forma.id}`]}`} />
      </div>
    </div>
  );
}
