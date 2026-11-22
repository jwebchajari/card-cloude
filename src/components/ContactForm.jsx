"use client";
import { useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import s from "@/app/landing.module.css";

/** No guarda nada: arma el mensaje y lo abre en WhatsApp o en el correo del visitante. */
export default function ContactForm({ whatsapp, email }) {
  const [f, setF] = useState({ local: "", rubro: "", ciudad: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function buildMessage() {
    const lines = [`Hola, quiero sumar mi local a CardCloude.`, `Local: ${f.local.trim()}`];
    if (f.rubro.trim()) lines.push(`Qué vendemos: ${f.rubro.trim()}`);
    if (f.ciudad.trim()) lines.push(`Ciudad: ${f.ciudad.trim()}`);
    return lines.join("\n");
  }

  function send(channel) {
    if (!f.local.trim()) {
      setError("Escribí el nombre de tu local.");
      return;
    }
    setError("");
    const text = encodeURIComponent(buildMessage());
    if (channel === "whatsapp") window.open(`https://wa.me/${whatsapp}?text=${text}`, "_blank", "noopener,noreferrer");
    else window.location.href = `mailto:${email}?subject=${encodeURIComponent("Quiero sumar mi local a CardCloude")}&body=${text}`;
  }

  return (
    <form className={s.contactForm} noValidate onSubmit={(e) => { e.preventDefault(); send(whatsapp ? "whatsapp" : "email"); }}>
      <img src="/brand/mark-color.svg" alt="" width={70} height={56} />
      <h3>Contanos de tu local</h3>
      <label className="field">Nombre del local<input className="input" value={f.local} maxLength={80} autoComplete="organization" aria-invalid={error ? "true" : undefined} onChange={set("local")} /></label>
      <div className={s.formCols}>
        <label className="field">Qué vendés<input className="input" value={f.rubro} maxLength={60} placeholder="Hamburguesas" onChange={set("rubro")} /></label>
        <label className="field">Ciudad<input className="input" value={f.ciudad} maxLength={80} onChange={set("ciudad")} /></label>
      </div>
      {error ? <p className="error-text" role="alert">{error}</p> : null}
      {whatsapp ? <button type="submit" className="btn btn-primary"><MessageCircle size={18} aria-hidden /> Enviar por WhatsApp</button> : null}
      {email ? <button type={whatsapp ? "button" : "submit"} className={whatsapp ? "btn" : "btn btn-primary"} onClick={whatsapp ? () => send("email") : undefined}><Mail size={18} aria-hidden /> Enviar por mail</button> : null}
    </form>
  );
}
