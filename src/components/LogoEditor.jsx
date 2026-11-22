"use client";
import { useEffect, useRef, useState } from "react";
import { Move, RotateCw, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import LocalCard from "@/components/LocalCard";
import Sheet from "@/components/ui/Sheet";
import { cldUrl } from "@/lib/cloudinary-url";
import s from "./panel.module.css";

const OUT = 640;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 4;
const DEFAULTS = { zoom: 1, x: 0, y: 0, rotation: 0, bg: "none", color: "#ffc400" };
const BACKGROUNDS = [
  { id: "none", label: "Sin fondo" },
  { id: "white", label: "Blanco", color: "#ffffff" },
  { id: "black", label: "Negro", color: "#000000" },
  { id: "yellow", label: "Amarillo", color: "#ffc400" },
  { id: "red", label: "Rojo", color: "#e3261b" },
  { id: "custom", label: "Otro" },
];

function openImage({ file, src }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = file ? URL.createObjectURL(file) : null;
    if (!file) img.crossOrigin = "anonymous";
    img.onload = () => (img.naturalWidth > 0 ? resolve({ img, objectUrl }) : reject(new Error("empty")));
    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error("load"));
    };
    img.src = objectUrl || cldUrl(src, "f_png,c_limit,w_1200");
  });
}

async function openFirst(sources) {
  for (const source of sources) {
    try {
      return await openImage(source);
    } catch {
      // Prueba la siguiente ruta disponible del logo.
    }
  }
  throw new Error("No pudimos abrir este logo. Subilo de nuevo en JPG o PNG.");
}

function clamp(st) {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, st.zoom));
  const limit = (OUT / 2) * (zoom + 0.6);
  return { ...st, zoom, x: Math.min(limit, Math.max(-limit, st.x)), y: Math.min(limit, Math.max(-limit, st.y)) };
}

function paint(canvas, img, st) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, OUT, OUT);
  if (st.bg !== "none") {
    ctx.fillStyle = st.bg === "custom" ? st.color : BACKGROUNDS.find((b) => b.id === st.bg).color;
    ctx.fillRect(0, 0, OUT, OUT);
  }
  const turned = st.rotation % 180 !== 0;
  const iw = turned ? img.naturalHeight : img.naturalWidth;
  const ih = turned ? img.naturalWidth : img.naturalHeight;
  const k = Math.min(OUT / iw, OUT / ih) * st.zoom;
  ctx.save();
  ctx.imageSmoothingQuality = "high";
  ctx.translate(OUT / 2 + st.x, OUT / 2 + st.y);
  ctx.rotate((st.rotation * Math.PI) / 180);
  ctx.scale(k, k);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx.restore();
}

/** Encuadra el logo y muestra en vivo la tarjeta del inicio. Devuelve un PNG cuadrado. */
export default function LogoEditor({ sources, local, onCancel, onDone }) {
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const drag = useRef(null);
  const [img, setImg] = useState(null);
  const [st, setSt] = useState(DEFAULTS);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (patch) => setSt((prev) => clamp({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));

  useEffect(() => {
    let alive = true;
    let objectUrl = null;
    openFirst(sources)
      .then((r) => {
        objectUrl = r.objectUrl;
        if (alive) setImg(r.img);
        else if (objectUrl) URL.revokeObjectURL(objectUrl);
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [sources]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!img || !canvas) return undefined;
    const frame = requestAnimationFrame(() => {
      try {
        paint(canvas, img, st);
        const preview = previewRef.current;
        if (preview) {
          const ctx = preview.getContext("2d");
          ctx.clearRect(0, 0, preview.width, preview.height);
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(canvas, 0, 0, preview.width, preview.height);
        }
      } catch {
        setError("No pudimos editar este logo. Subilo de nuevo en JPG o PNG.");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [img, st]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      setSt((prev) => clamp({ ...prev, zoom: prev.zoom - e.deltaY * 0.0015 }));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [img]);

  function onPointerDown(e) {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: st.x, y: st.y };
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d) return;
    const ratio = OUT / e.currentTarget.clientWidth;
    update({ x: d.x + (e.clientX - d.px) * ratio, y: d.y + (e.clientY - d.py) * ratio });
  }

  function onKeyDown(e) {
    const step = e.shiftKey ? 40 : 10;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    update((p) => ({ x: p.x + move[0], y: p.y + move[1] }));
  }

  function finish() {
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    setBusy(true);
    try {
      paint(canvas, img, st);
      canvas.toBlob((blob) => {
        setBusy(false);
        if (blob) onDone(blob);
        else setError("No se pudo preparar el logo. Probá de nuevo.");
      }, "image/png");
    } catch {
      setBusy(false);
      setError("No pudimos editar este logo. Subilo de nuevo en JPG o PNG.");
    }
  }

  return (
    <div className="panel-ui">
      <Sheet
        open
        editor
        title="Editar logo"
        onClose={onCancel}
        footer={
          <div className={s.logoEditorActions}>
            <button type="button" className="btn" onClick={() => setSt(DEFAULTS)} disabled={!img}><Undo2 size={18} aria-hidden /> Restablecer</button>
            <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={finish} disabled={!img || busy || Boolean(error)}>{busy ? "Preparando..." : "Usar logo"}</button>
          </div>
        }
      >
        {error ? <p className="error-text" role="alert">{error}</p> : (
          <div className={s.logoEditor}>
            <div className={s.logoStageWrap}>
              <div className={s.logoStage}>
                <canvas
                  ref={canvasRef}
                  width={OUT}
                  height={OUT}
                  tabIndex={0}
                  role="application"
                  aria-label="Logo. Arrastrá para encuadrar o usá las flechas del teclado."
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={() => { drag.current = null; }}
                  onPointerCancel={() => { drag.current = null; }}
                  onKeyDown={onKeyDown}
                />
                {!img ? <span>Cargando logo...</span> : null}
              </div>
              <p className="hint"><Move size={14} aria-hidden /> Arrastrá para mover. Usá la rueda o el control para hacer zoom.</p>
            </div>

            <div className={s.logoTools}>
              <div className={s.zoomControl}>
                <button type="button" className="btn" aria-label="Alejar" onClick={() => update((p) => ({ zoom: p.zoom - 0.1 }))}><ZoomOut size={18} aria-hidden /></button>
                <input type="range" aria-label="Zoom" min={MIN_ZOOM} max={MAX_ZOOM} step={0.01} value={st.zoom} onChange={(e) => update({ zoom: Number(e.target.value) })} />
                <button type="button" className="btn" aria-label="Acercar" onClick={() => update((p) => ({ zoom: p.zoom + 0.1 }))}><ZoomIn size={18} aria-hidden /></button>
              </div>
              <button type="button" className="btn" onClick={() => update((p) => ({ rotation: (p.rotation + 90) % 360, x: 0, y: 0 }))}><RotateCw size={18} aria-hidden /> Rotar 90°</button>

              <fieldset className={s.logoBgs}>
                <legend>Fondo del logo</legend>
                <div>
                  {BACKGROUNDS.map((b) => (
                    <label key={b.id}>
                      <input type="radio" name="logo-bg" checked={st.bg === b.id} onChange={() => update({ bg: b.id })} />
                      <span className={b.id === "none" ? s.bgNone : undefined} style={b.id === "none" ? undefined : { background: b.id === "custom" ? st.color : b.color }} aria-hidden />
                      {b.label}
                    </label>
                  ))}
                </div>
                {st.bg === "custom" ? <label className={s.colorField}>Elegí el color <input type="color" value={st.color} onChange={(e) => update({ color: e.target.value })} /></label> : null}
              </fieldset>

              <div className={s.cardPreview}>
                <p>Así se ve en el inicio</p>
                <LocalCard preview local={local} logoSlot={<canvas ref={previewRef} width={160} height={160} aria-hidden />} />
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
