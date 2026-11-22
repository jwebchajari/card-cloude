"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Brand from "@/components/Brand";
import { authError, login, resetPassword, useSession } from "@/lib/session";
import s from "./panel.module.css";

export default function LoginForm() {
  const router = useRouter();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (session.status === "in" || session.status === "error") router.replace("/panel");
  }, [session.status, router]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim() || !password) {
      setError("Completá email y contraseña.");
      return;
    }
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(authError(err));
      setBusy(false);
    }
  }

  async function forgot() {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Escribí tu email para recibir el link.");
      return;
    }
    try {
      await resetPassword(email);
      setInfo("Si el email tiene una cuenta, te llega un link para cambiar la contraseña.");
    } catch (err) {
      setError(authError(err));
    }
  }

  return (
    <main className={s.center}>
      <form className={s.login} onSubmit={submit} noValidate>
        <Brand />
        <h1>Entrá a tu panel</h1>
        <label className="field">
          Email
          <input className="input" type="email" autoComplete="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          Contraseña
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? <p className="error-text" role="alert">{error}</p> : null}
        {info ? <p className="ok-text" role="status">{info}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={busy || session.status === "loading"}>
          {busy ? "Entrando..." : "Entrar"}
        </button>
        <button type="button" className={s.textBtn} onClick={forgot}>
          Olvidé mi contraseña
        </button>
      </form>
    </main>
  );
}
