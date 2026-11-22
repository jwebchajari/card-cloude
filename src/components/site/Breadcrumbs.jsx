import Link from "next/link";
import { ChevronRight } from "lucide-react";
import s from "@/app/pages.module.css";

export default function Breadcrumbs({ items }) {
  return (
    <nav className={s.crumbs} aria-label="Ruta de navegación">
      <ol>
        {items.map(([label, href], i) => (
          <li key={label}>
            {i > 0 ? <ChevronRight size={14} aria-hidden /> : null}
            {i < items.length - 1 ? <Link href={href}>{label}</Link> : <span aria-current="page">{label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
