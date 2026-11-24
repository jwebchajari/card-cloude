"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cldUrl } from "@/lib/cloudinary-url";
import s from "./home.module.css";

const BASE = "https://res.cloudinary.com/nusfx2nl/image/upload";
const WIDTHS = [360, 480, 720, 1080];
const SLIDE_MS = 4500;

const SLIDES = [
  ["v1795481360/CardCloude/_home/01-portada.png", "Tu carta online con pedidos directo a WhatsApp y un panel simple para manejar todo desde el celular."],
  ["v1795481362/CardCloude/_home/02-productos.png", "Tu carta siempre al día: cambiá precios, marcá ofertas y ocultá productos."],
  ["v1795481364/CardCloude/_home/03-cargar-producto.png", "Cargar un producto es fácil: nombre, precio, categoría, ingredientes y venta por cantidad."],
  ["v1795481369/CardCloude/_home/04-fotos.png", "Editor de fotos con encuadre, brillo, contraste y saturación."],
  ["v1795481372/CardCloude/_home/05-envios-y-pagos.png", "Envíos y pagos a tu manera: envío o retiro, efectivo, transferencia o tarjeta."],
  ["v1795481374/CardCloude/_home/06-horarios.png", "Horarios automáticos: la carta pasa sola de abierto a cerrado, con doble turno."],
  ["v1795481376/CardCloude/_home/07-qr.png", "Código QR listo para imprimir, con cartel A5 y descarga en PNG o SVG."],
  ["v1795481378/CardCloude/_home/08-visitas.png", "Estadísticas de visitas a la carta: hoy, 7 días, total y últimos 14 días."],
  ["v1795481380/CardCloude/_home/09-consulta.png", "Sumá tu local a CardCloude. Consultá el precio por WhatsApp."],
];

const sized = (url, width) => cldUrl(url, `f_auto,q_auto:good,c_limit,w_${width}`);
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function PanelCarousel() {
  const root = useRef(null);
  const track = useRef(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [visible, setVisible] = useState(false);

  function goTo(next) {
    const el = track.current;
    const target = (next + SLIDES.length) % SLIDES.length;
    el.scrollTo({ left: target * el.clientWidth, behavior: reducedMotion() ? "auto" : "smooth" });
  }

  function onScroll() {
    const el = track.current;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  useEffect(() => {
    if (reducedMotion()) {
      const id = requestAnimationFrame(() => setPaused(true));
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.5 });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused || held || !visible) return undefined;
    const id = setTimeout(() => {
      const el = track.current;
      const target = (index + 1) % SLIDES.length;
      el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
    }, SLIDE_MS);
    return () => clearTimeout(id);
  }, [index, paused, held, visible]);

  return (
    <div
      ref={root}
      className={s.carousel}
      role="group"
      aria-roledescription="carrusel"
      aria-label="Cómo funciona el panel de CardCloude"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={(e) => setHeld(e.target.matches(":focus-visible"))}
      onBlur={() => setHeld(false)}
    >
      <ul ref={track} className={s.track} onScroll={onScroll} tabIndex={0} aria-label="Imágenes del panel">
        {SLIDES.map(([file, alt], i) => {
          const url = `${BASE}/${file}`;
          return (
            <li key={file} aria-roledescription="imagen" aria-label={`${i + 1} de ${SLIDES.length}`}>
              <img
                src={sized(url, 720)}
                srcSet={WIDTHS.map((w) => `${sized(url, w)} ${w}w`).join(", ")}
                sizes="(min-width: 520px) 460px, calc(100vw - 32px)"
                alt={alt}
                width={1080}
                height={1350}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </li>
          );
        })}
      </ul>
      <div className={s.controls}>
        <button type="button" className="btn" onClick={() => goTo(index - 1)} aria-label="Imagen anterior">
          <ChevronLeft size={20} aria-hidden />
        </button>
        <div className={s.dots} aria-hidden>
          {SLIDES.map(([file], i) => <span key={file} data-active={i === index ? "" : undefined} />)}
        </div>
        <span className="visually-hidden" aria-live={paused ? "polite" : "off"}>Imagen {index + 1} de {SLIDES.length}</span>
        <button type="button" className="btn" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Reproducir carrusel" : "Pausar carrusel"}>
          {paused ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
        </button>
        <button type="button" className="btn" onClick={() => goTo(index + 1)} aria-label="Imagen siguiente">
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>
    </div>
  );
}
