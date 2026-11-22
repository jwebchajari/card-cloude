import Link from "next/link";
import s from "./brand.module.css";

export default function Brand({ href = "/" }) {
  return (
    <Link href={href} className={s.brand}>
      <img src="/logo-mark.webp" alt="" width={34} height={36} />
      CardCloude
    </Link>
  );
}
