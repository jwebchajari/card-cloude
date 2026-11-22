"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ExternalLink, FileImage, Printer } from "lucide-react";
import Loading from "@/components/Loading";
import { cldUrl } from "@/lib/cloudinary-url";
import { QR_MARGIN, downloadBlob, drawQr, qrMatrix, qrPath, qrSvg } from "@/lib/qr";
import { useDashboard } from "./DashboardShell";
import s from "./qr.module.css";

// Cartel A5 a 300 dpi.
const POSTER_W = 1748;
const POSTER_H = 2480;
const QR_PNG = 2048;

function cleanUrl(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.href.replace(/\/$/, "") : "";
  } catch {
    return "";
  }
}

function loadLogo(sources) {
  return sources.reduce(
    (chain, src) =>
      chain.then(
        (found) =>
          found ||
          new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img.naturalWidth > 0 ? img : null);
            img.onerror = () => resolve(null);
            img.src = src;
          })
      ),
    Promise.resolve(null)
  );
}

function fitText(ctx, text, maxWidth, start, min, family) {
  let size = start;
  do {
    ctx.font = `800 ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 4;
  } while (size > min);
  return min;
}

function wrapName(ctx, text, maxWidth) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function drawPoster(canvas, { nombre, matrix, logo, family }) {
  const ctx = canvas.getContext("2d");
  const cx = POSTER_W / 2;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  ctx.fillStyle = "#e3261b";
  ctx.fillRect(0, 0, POSTER_W, 56);
  ctx.fillStyle = "#ffc400";
  ctx.fillRect(0, POSTER_H - 56, POSTER_W, 56);

  let y = 150;
  if (logo) {
    const box = 300;
    const k = Math.min(box / logo.naturalWidth, box / logo.naturalHeight);
    const w = logo.naturalWidth * k;
    const h = logo.naturalHeight * k;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(logo, cx - w / 2, y + (box - h) / 2, w, h);
    y += box + 50;
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#0b0a08";
  const size = fitText(ctx, nombre, POSTER_W - 240, 136, 88, family);
  ctx.font = `800 ${size}px ${family}`;
  const lines = ctx.measureText(nombre).width > POSTER_W - 240 ? wrapName(ctx, nombre, POSTER_W - 240) : [nombre];
  for (const line of lines) {
    y += size;
    ctx.fillText(line, cx, y);
    y += 14;
  }

  const qrSize = Math.min(1120, POSTER_H - y - 410);
  drawQr(ctx, matrix, cx - qrSize / 2, y + 40, qrSize);

  ctx.fillStyle = "#b5170f";
  ctx.font = `800 92px ${family}`;
  ctx.fillText("Escaneá y mirá la carta", cx, POSTER_H - 220);
  ctx.fillStyle = "#3b3630";
  ctx.font = `600 54px ${family}`;
  ctx.fillText("Pedí directo por WhatsApp", cx, POSTER_H - 130);
}

export function QrView({ local, nombre, url, logo = "" }) {
  const posterRef = useRef(null);
  const [error, setError] = useState("");
  const matrix = useMemo(() => qrMatrix(url), [url]);
  const path = useMemo(() => qrPath(matrix), [matrix]);
  const viewBox = matrix.count + QR_MARGIN * 2;
  const isTemporaryDomain = /\.vercel\.app$/i.test(new URL(url).hostname);

  useEffect(() => {
    let alive = true;
    const sources = logo ? [cldUrl(logo, "f_png,c_fit,w_600,h_600")] : [`${url}/logo.png`, `${url}/logo-sm.webp`];
    Promise.all([loadLogo(sources), document.fonts.ready]).then(([img]) => {
      if (!alive || !posterRef.current) return;
      const family = getComputedStyle(document.documentElement).getPropertyValue("--font-bricolage").trim() || "Arial, sans-serif";
      drawPoster(posterRef.current, { nombre, matrix, logo: img, family });
    });
    return () => {
      alive = false;
    };
  }, [logo, matrix, nombre, url]);

  function downloadPng() {
    setError("");
    const total = matrix.count + QR_MARGIN * 2;
    const size = Math.floor(QR_PNG / total) * total;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    drawQr(canvas.getContext("2d"), matrix, 0, 0, size);
    canvas.toBlob((blob) => (blob ? downloadBlob(blob, `qr-${local}.png`) : setError("No se pudo preparar el archivo. Probá de nuevo.")), "image/png");
  }

  function downloadSvg() {
    setError("");
    downloadBlob(new Blob([qrSvg(matrix)], { type: "image/svg+xml;charset=utf-8" }), `qr-${local}.svg`);
  }

  function downloadPoster() {
    setError("");
    try {
      posterRef.current.toBlob((blob) => (blob ? downloadBlob(blob, `cartel-qr-${local}.png`) : setError("No se pudo preparar el cartel. Probá de nuevo.")), "image/png");
    } catch {
      setError("No se pudo preparar el cartel. Probá de nuevo.");
    }
  }

  return (
    <div className={s.page}>
      <div>
        <h1 className={s.title}>Código QR de tu carta</h1>
        <p className="hint">Imprimilo para tus mesas, mostrador o vidriera. Cuando cambies precios o productos, el mismo QR sigue funcionando.</p>
      </div>

      <div className={s.grid}>
        <section className={s.panel} aria-labelledby="qr-solo">
          <h2 id="qr-solo">Código QR</h2>
          <svg className={s.code} viewBox={`0 0 ${viewBox} ${viewBox}`} shapeRendering="crispEdges" role="img" aria-label={`Código QR de la carta de ${nombre}`}>
            <rect width={viewBox} height={viewBox} fill="#fff" />
            <path fill="#000" d={path} />
          </svg>
          <p className={s.link}>Abre: <a href={url} target="_blank" rel="noopener noreferrer">{url} <ExternalLink size={14} aria-hidden /></a></p>
          <div className={s.actions}>
            <button type="button" className="btn btn-primary" onClick={downloadPng}><Download size={18} aria-hidden /> Descargar PNG</button>
            <button type="button" className="btn" onClick={downloadSvg}><FileImage size={18} aria-hidden /> Descargar SVG</button>
          </div>
          <p className="hint">Usá SVG si lo va a imprimir una imprenta o en gran tamaño.</p>
        </section>

        <section className={s.panel} aria-labelledby="qr-cartel">
          <h2 id="qr-cartel">Cartel listo para imprimir</h2>
          <canvas ref={posterRef} className={s.poster} width={POSTER_W} height={POSTER_H} role="img" aria-label={`Cartel A5 con el código QR de ${nombre}`} />
          <button type="button" className="btn btn-primary" onClick={downloadPoster}><Printer size={18} aria-hidden /> Descargar cartel A5</button>
        </section>
      </div>

      {error ? <p className="error-text" role="alert">{error}</p> : null}
      {isTemporaryDomain ? <p className={s.notice}>Tu carta usa una dirección temporal. Si pasa a un dominio propio, volvé a descargar e imprimir el QR.</p> : null}
    </div>
  );
}

export default function QrPanel() {
  const { local, ficha, fichaReady } = useDashboard();
  if (!fichaReady) return <Loading />;
  const url = cleanUrl(ficha?.url);
  if (!url) {
    return (
      <div className={s.page}>
        <h1 className={s.title}>Código QR de tu carta</h1>
        <p className={s.notice}>Tu carta todavía no tiene un link publicado. Cuando el administrador lo cargue, vas a poder descargar el QR desde acá.</p>
      </div>
    );
  }
  return <QrView local={local} nombre={ficha.nombre || local} url={url} logo={ficha.logo || ""} />;
}
