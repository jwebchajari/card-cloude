"use client";
import { formatPrice, hasOffer, unitPrice } from "@/lib/catalogo";
import s from "./menu.module.css";

export function Price({ product, big = false }) {
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
