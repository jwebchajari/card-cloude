"use client";
import { formatPrice, hasOffer, productPacks, resolvePack, unitPrice } from "@/lib/catalogo";
import s from "./menu.module.css";

export function Price({ product, big = false, pack = null }) {
  const packs = productPacks(product);
  if (packs.length) {
    const chosen = pack || packs.length === 1 ? resolvePack(product, pack) : null;
    return (
      <span className={`${s.price} ${big ? s.priceBig : ""}`}>
        <small className={s.pricePack}>{chosen ? chosen.key : "Desde"}</small>
        <span>{formatPrice(chosen ? chosen.precio : Math.min(...packs.map((p) => p.precio)))}</span>
      </span>
    );
  }
  const offer = hasOffer(product);
  return (
    <span className={`${s.price} ${big ? s.priceBig : ""}`}>
      {offer ? (
        <del className={s.priceOld}>
          <span className="visually-hidden">Antes </span>
          {formatPrice(product.valor)}
        </del>
      ) : null}
      <span className={offer ? s.priceOffer : undefined}>{formatPrice(unitPrice(product))}</span>
    </span>
  );
}
