import Link from "next/link";
import s from "./brand.module.css";

export default function Brand({ href = "/", tone = "color" }) {
  return (
    <Link href={href} className={s.brand} aria-label="CardCloude">
      <img src={`/brand/logo-horizontal-${tone}.svg`} alt="CardCloude" width={132} height={48} />
    </Link>
  );
}
