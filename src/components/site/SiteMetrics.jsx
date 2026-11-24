"use client";

import { useEffect } from "react";

const PRIVATE_PATHS = /^\/(panel|login)(\/|$)/;
const TEAM_KEY = "cc-equipo"; // Quien entra al panel deja de sumar visitas desde ese navegador.

function once(event) {
  try {
    const key = `cc-metrica-${event}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    return;
  }
  // sendBeacon sobrevive a que la página se vaya a WhatsApp.
  navigator.sendBeacon("/api/metricas", new Blob([JSON.stringify({ event })], { type: "text/plain" }));
}

function excluded() {
  try {
    if (PRIVATE_PATHS.test(location.pathname)) localStorage.setItem(TEAM_KEY, "1");
    return navigator.webdriver || localStorage.getItem(TEAM_KEY) === "1";
  } catch {
    return true;
  }
}

/** Una visita y un clic a WhatsApp por sesión. Sin cookies ni datos personales. */
export default function SiteMetrics() {
  useEffect(() => {
    if (excluded()) return undefined;
    once("visitas");
    const onClick = (e) => {
      if (e.target.closest?.('a[data-track="whatsapp"]')) once("whatsapp");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
