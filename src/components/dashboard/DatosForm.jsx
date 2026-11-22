"use client";
import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import { getDatos, saveDatos } from "@/lib/admin-data";
import { authError } from "@/lib/session";
import { SHIPPING_ZONES, envioLabel, fullAddress, instagramUrl, facebookUrl, waNumber } from "@/lib/catalogo";
import { useDashboard } from "./DashboardShell";
import s from "./dashboard.module.css";

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
        })
      )
      .catch((e) => setStatus({ saving: false, msg: "", error: authError(e) }));
  }, [local]);

  if (!form) return status.error ? <p className="error-text">{status.error}</p> : <Loading />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNested = (g, k) => (e) => setForm((f) => ({ ...f, [g]: { ...f[g], [k]: e.target.value } }));
  const wa = waNumber(form.whatsapp);

  async function submit(e) {
    e.preventDefault();
    setStatus({ saving: true, msg: "", error: "" });
    try {
      await saveDatos(local, form);
      setStatus({ saving: false, msg: "Guardado. La carta se actualiza en segundos.", error: "" });
    } catch (err) {
      setStatus({ saving: false, msg: "", error: authError(err) });
    }
  }

  return (
    <form className={s.stack} onSubmit={submit} noValidate>
      <h1 className={s.h1}>Datos del local</h1>

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
        <legend className={s.legend}>Cobro y envío</legend>
        <label className="field">
          <span>Alias para transferencias</span>
          <input className="input" value={form.alias} onChange={set("alias")} maxLength={80} placeholder="mi.local" autoCapitalize="none" />
        </label>
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
