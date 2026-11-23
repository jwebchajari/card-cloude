"use client";
import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import { getDatos, saveDatos } from "@/lib/admin-data";
import { authError } from "@/lib/session";
import { SHIPPING_ZONES, cleanOptions, envioLabel, fullAddress, instagramUrl, facebookUrl, waNumber } from "@/lib/catalogo";
import { useDashboard } from "./DashboardShell";
import h from "./horarios.module.css";
import s from "./dashboard.module.css";

function OptionSwitch({ title, hint, checked, onChange }) {
  return (
    <div className={s.optionRow}>
      <span className={s.optionText}>
        <strong>{title}</strong>
        <small>{hint}</small>
      </span>
      <label className={h.switch}>
        <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={title} />
        <span aria-hidden />
      </label>
    </div>
  );
}

export default function DatosForm() {
  const { local } = useDashboard();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState({ saving: false, msg: "", error: "" });

  useEffect(() => {
    getDatos(local)
      .then((d) =>
        setForm({
          nombre: d.nombre || "",
          whatsapp: d.whatsapp || "",
          direccion: d.direccion || "",
          alias: d.alias || "",
          costoEnvio: d.costoEnvio === null || d.costoEnvio === undefined ? "" : String(d.costoEnvio),
          costoEnvioFuera: d.costoEnvioFuera === null || d.costoEnvioFuera === undefined ? "" : String(d.costoEnvioFuera),
          redes: { instagram: d.redes?.instagram || "", facebook: d.redes?.facebook || "" },
          opciones: cleanOptions(d.opciones),
          tieneOpciones: Boolean(d.opciones),
        })
      )
      .catch((e) => setStatus({ saving: false, msg: "", error: authError(e) }));
  }, [local]);

  if (!form) return status.error ? <p className="error-text">{status.error}</p> : <Loading />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNested = (g, k) => (e) => setForm((f) => ({ ...f, [g]: { ...f[g], [k]: e.target.value } }));
  const setOption = (k) => (value) => setForm((f) => ({ ...f, opciones: { ...f.opciones, [k]: value } }));
  const wa = waNumber(form.whatsapp);

  async function submit(e) {
    e.preventDefault();
    setStatus({ saving: true, msg: "", error: "" });
    try {
      await saveDatos(local, form);
      // Una vez guardada una opción apagada, volver a activarla también tiene que escribirse.
      setForm((f) => ({ ...f, tieneOpciones: f.tieneOpciones || Object.values(form.opciones).includes(false) }));
      setStatus({ saving: false, msg: "Guardado. La carta se actualiza en segundos.", error: "" });
    } catch (err) {
      setStatus({ saving: false, msg: "", error: authError(err) });
    }
  }

  return (
    <form className={s.stack} onSubmit={submit} noValidate>

      <fieldset className={s.card}>
        <legend className={s.legend}>General</legend>
        <label className="field">
          <span>Nombre del local</span>
          <input className="input" value={form.nombre} onChange={set("nombre")} maxLength={80} />
        </label>
        <label className="field">
          <span>WhatsApp para pedidos</span>
          <input className="input" type="tel" inputMode="tel" value={form.whatsapp} onChange={set("whatsapp")} maxLength={30} placeholder="03456 15 123456" />
          <span className="hint">{form.whatsapp ? `Los pedidos llegan a wa.me/${wa}` : "Sin WhatsApp no se pueden enviar pedidos."}</span>
        </label>
        <label className="field">
          <span>Dirección</span>
          <input className="input" value={form.direccion} onChange={set("direccion")} maxLength={200} placeholder="Calle y número" />
          {form.direccion ? <span className="hint">Se muestra como: {fullAddress(form.direccion)}</span> : null}
        </label>
      </fieldset>

      <fieldset className={s.card}>
        <legend className={s.legend}>Envío y formas de pago</legend>
        <p className="hint">Lo que apagues deja de aparecer en la carta. Retiro en el local y efectivo siempre están disponibles.</p>

        <OptionSwitch title="Envío a domicilio" hint={form.opciones.envio ? "El cliente puede pedir envío." : "Solo retiro en el local."} checked={form.opciones.envio} onChange={setOption("envio")} />
        {form.opciones.envio ? (
          <div className="field">
            <div className={s.row2}>
              {SHIPPING_ZONES.map((z) => (
                <label key={z.id} className="field">
                  <span>Envío {z.label.charAt(0).toLowerCase() + z.label.slice(1)} ($)</span>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={form[z.field]}
                    onChange={(e) => setForm((f) => ({ ...f, [z.field]: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
                    placeholder="A confirmar"
                  />
                  <span className="hint">En la carta: {envioLabel(form[z.field])}</span>
                </label>
              ))}
            </div>
            <span className="hint">Vacío = a confirmar, 0 = gratis.</span>
          </div>
        ) : null}

        <OptionSwitch title="Transferencia" hint={form.opciones.transferencia ? "El cliente ve tu alias al pagar." : "No se ofrece en la carta."} checked={form.opciones.transferencia} onChange={setOption("transferencia")} />
        {form.opciones.transferencia ? (
          <label className="field">
            <span>Alias para transferencias</span>
            <input className="input" value={form.alias} onChange={set("alias")} maxLength={80} placeholder="mi.local" autoCapitalize="none" />
          </label>
        ) : null}

        <OptionSwitch title="Tarjeta" hint={form.opciones.tarjeta ? "El cliente puede elegir pagar con tarjeta." : "No se ofrece en la carta."} checked={form.opciones.tarjeta} onChange={setOption("tarjeta")} />
      </fieldset>

      <fieldset className={s.card}>
        <legend className={s.legend}>Redes</legend>
        <label className="field">
          <span>Instagram</span>
          <input className="input" value={form.redes.instagram} onChange={setNested("redes", "instagram")} placeholder="@milocal" autoCapitalize="none" />
          {form.redes.instagram ? <span className="hint">{instagramUrl(form.redes.instagram) || "No parece un usuario válido"}</span> : null}
        </label>
        <label className="field">
          <span>Facebook</span>
          <input className="input" value={form.redes.facebook} onChange={setNested("redes", "facebook")} placeholder="Página o link" autoCapitalize="none" />
          {form.redes.facebook ? <span className="hint">{facebookUrl(form.redes.facebook) || "No parece un link válido"}</span> : null}
        </label>
      </fieldset>

      <div className={s.saveBar}>
        {status.error ? (
          <p className="error-text" role="alert">
            {status.error}
          </p>
        ) : null}
        {status.msg ? (
          <p className={s.ok} role="status">
            {status.msg}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={status.saving}>
          {status.saving ? "Guardando..." : "Guardar datos"}
        </button>
      </div>
    </form>
  );
}
