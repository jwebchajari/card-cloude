"use client";
import { useEffect, useRef, useState } from "react";
import { Contrast, Crop, Droplet, Expand, ImageIcon, Move, Palette, RotateCw, Shrink, SlidersHorizontal, Sun, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import { Price } from "@/components/menu/ProductRow";
import m from "@/components/menu/menu.module.css";
import { cldUrl } from "@/lib/cloudinary-url";
import { normalizeProduct } from "@/lib/menu-shared";
import { fotoForma } from "@/lib/catalogo";
import s from "./dashboard.module.css";

// Foto guardada en 4:3: sirve para la miniatura cuadrada, el detalle 16:10 y la tarjeta de compartir.
const OUT_W = 1600;
const OUT_H = 1200;
const PREVIEW_W = 960;
const MAX_ZOOM = 4;
const KEEP_VISIBLE = 120; // parte de la foto que siempre queda dentro del cuadro

const DEFAULTS = { zoom: 1, x: 0, y: 0, rotation: 0, brightness: 100, contrast: 100, saturation: 100, bg: "blur", color: "#7a1f12" };

const BACKGROUNDS = [
  { id: "blur", label: "Difuminado" },
  { id: "black", label: "Negro", color: "#000000" },
  { id: "cream", label: "Crema", color: "#fdf6f0" },
  { id: "red", label: "Rojo", color: "#e00000" },
  { id: "custom", label: "Otro color" },
];

const TABS = [
  { id: "encuadre", label: "Encuadre", Icon: Crop },
  { id: "fondo", label: "Fondo", Icon: Palette },
  { id: "ajustes", label: "Ajustes", Icon: SlidersHorizontal },
];

const SLIDERS = [
  { key: "brightness", label: "Brillo", Icon: Sun },
  { key: "contrast", label: "Contraste", Icon: Contrast },
  { key: "saturation", label: "Color", Icon: Droplet },
];

function loadImage({ file, src }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = file ? URL.createObjectURL(file) : null;
    if (!file) img.crossOrigin = "anonymous";
    const fail = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error(file ? "No pudimos abrir esa foto. Probá con otra (JPG o PNG)." : "Esta foto no se puede editar desde acá. Subila de nuevo desde tu celular o compu."));
    };
    img.onload = () => (img.naturalWidth > 0 && img.naturalHeight > 0 ? resolve({ img, objectUrl }) : fail());
    img.onerror = fail;
    img.src = objectUrl || cldUrl(src, "f_jpg,q_auto,c_limit,w_2400");
  });
}

function turnedSize(img, rotation) {
  const turned = rotation % 180 !== 0;
  return { iw: turned ? img.naturalHeight : img.naturalWidth, ih: turned ? img.naturalWidth : img.naturalHeight };
}

/** zoom 1 llena el cuadro. Menos de 1 achica la foto y deja ver el fondo. */
function photoSize(img, st) {
  const { iw, ih } = turnedSize(img, st.rotation);
  const k = Math.max(OUT_W / iw, OUT_H / ih) * st.zoom;
  return { w: iw * k, h: ih * k, k };
}

function fitZoom(img, rotation) {
  const { iw, ih } = turnedSize(img, rotation);
  return Math.min(OUT_W / iw, OUT_H / ih) / Math.max(OUT_W / iw, OUT_H / ih);
}

function minZoom(img, rotation) {
  return Math.max(0.15, fitZoom(img, rotation) * 0.6);
}

function clampState(img, st) {
  const zoom = Math.min(MAX_ZOOM, Math.max(minZoom(img, st.rotation), st.zoom));
  const { w, h } = photoSize(img, { ...st, zoom });
  const mx = Math.max((w - OUT_W) / 2, (OUT_W + w) / 2 - KEEP_VISIBLE);
  const my = Math.max((h - OUT_H) / 2, (OUT_H + h) / 2 - KEEP_VISIBLE);
  return { ...st, zoom, x: Math.min(mx, Math.max(-mx, st.x)), y: Math.min(my, Math.max(-my, st.y)) };
}

function coversFrame(img, st) {
  const { w, h } = photoSize(img, st);
  return Math.abs(st.x) <= (w - OUT_W) / 2 + 0.5 && Math.abs(st.y) <= (h - OUT_H) / 2 + 0.5;
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function drawPhoto(ctx, img, st, f) {
  const { k } = photoSize(img, st);
  ctx.save();
  ctx.imageSmoothingQuality = "high";
  ctx.translate((OUT_W / 2 + st.x) * f, (OUT_H / 2 + st.y) * f);
  ctx.rotate((st.rotation * Math.PI) / 180);
  ctx.scale(k * f, k * f);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx.restore();
}

// Difuminado por reducción y ampliación: ctx.filter no está disponible en todos los Safari de iPhone.
const backdrops = new WeakMap();
function blurredBackdrop(img, rotation) {
  const cached = backdrops.get(img);
  if (cached?.rotation === rotation) return cached.canvas;
  const tiny = makeCanvas(32, 24);
  const cover = { ...DEFAULTS, rotation, zoom: 1.15 };
  drawPhoto(tiny.getContext("2d"), img, cover, 32 / OUT_W);
  const mid = makeCanvas(128, 96);
  const midCtx = mid.getContext("2d");
  midCtx.imageSmoothingQuality = "high";
  midCtx.drawImage(tiny, 0, 0, 128, 96);
  const canvas = makeCanvas(480, 360);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(mid, 0, 0, 480, 360);
  backdrops.set(img, { rotation, canvas });
  return canvas;
}

function applyAdjustments(ctx, w, h, st) {
  const b = st.brightness / 100;
  const c = st.contrast / 100;
  const sat = st.saturation / 100;
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const r = (d[i] * b - 127.5) * c + 127.5;
    const g = (d[i + 1] * b - 127.5) * c + 127.5;
    const bl = (d[i + 2] * b - 127.5) * c + 127.5;
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    d[i] = l + (r - l) * sat;
    d[i + 1] = l + (g - l) * sat;
    d[i + 2] = l + (bl - l) * sat;
  }
  ctx.putImageData(image, 0, 0);
}

function paint(canvas, img, st) {
  const ctx = canvas.getContext("2d");
  const { width: W, height: H } = canvas;
  const f = W / OUT_W;

  if (st.bg === "blur") {
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(blurredBackdrop(img, st.rotation), 0, 0, W, H);
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  } else {
    ctx.fillStyle = st.bg === "custom" ? st.color : BACKGROUNDS.find((b) => b.id === st.bg).color;
  }
  ctx.fillRect(0, 0, W, H);

  if (st.brightness === 100 && st.contrast === 100 && st.saturation === 100) {
    drawPhoto(ctx, img, st, f);
    return;
  }
  // Los ajustes van en una capa aparte para no teñir el fondo.
  const layer = makeCanvas(W, H);
  const layerCtx = layer.getContext("2d", { willReadFrequently: true });
  drawPhoto(layerCtx, img, st, f);
  applyAdjustments(layerCtx, W, H, st);
  ctx.drawImage(layer, 0, 0);
}

function Slider({ label, Icon, value, onChange }) {
  const delta = value - 100;
  return (
    <label className={s.adjust}>
      <span className={s.adjustLabel}>
        <Icon size={16} aria-hidden /> {label}
      </span>
      <output className={s.adjustValue}>{delta > 0 ? `+${delta}` : delta}</output>
      <input type="range" min={50} max={150} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

/** Editor de foto: encuadre libre, fondo y ajustes. Devuelve un JPG 4:3 listo para subir. */
export default function PhotoEditor({ source, product, forma: formaId, title = "Editar foto", renderPreview = null, onCancel, onDone }) {
  const forma = fotoForma(formaId);
  const guide = forma.guide;
  const canvasRef = useRef(null);
  const thumbRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const [img, setImg] = useState(null);
  const [st, setSt] = useState(DEFAULTS);
  const [tab, setTab] = useState("encuadre");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fullPreview = Boolean(renderPreview);

  useEffect(() => {
    let alive = true;
    let objectUrl = null;
    loadImage(source)
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
  }, [source]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!img || !canvas) return undefined;
    const frame = requestAnimationFrame(() => {
      try {
        paint(canvas, img, st);
        const thumb = thumbRef.current;
        // La lista de la carta muestra el centro de la foto con la forma del local.
        if (thumb && fullPreview) thumb.getContext("2d").drawImage(canvas, 0, 0, thumb.width, thumb.height);
        else if (thumb) {
          const sw = canvas.width * guide.w;
          thumb.getContext("2d").drawImage(canvas, (canvas.width - sw) / 2, 0, sw, canvas.height, 0, 0, thumb.width, thumb.height);
        }
      } catch {
        setError("Esta foto no se puede editar desde acá. Subila de nuevo desde tu celular o compu.");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [img, st, fullPreview, guide.w]);

  function update(patch) {
    setSt((prev) => {
      const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
      return img ? clampState(img, next) : next;
    });
  }

  // La rueda necesita un listener no pasivo para no desplazar el panel mientras hace zoom.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      setSt((prev) => clampState(img, { ...prev, zoom: prev.zoom - e.deltaY * 0.0015 }));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [img]);

  function startGesture() {
    const pts = [...pointers.current.values()];
    if (pts.length === 1) gesture.current = { type: "drag", px: pts[0].x, py: pts[0].y, x: st.x, y: st.y };
    else if (pts.length === 2) gesture.current = { type: "pinch", dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1, zoom: st.zoom };
    else gesture.current = null;
  }

  function onPointerDown(e) {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startGesture();
  }

  function onPointerMove(e) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.type === "drag") {
      const ratio = OUT_W / e.currentTarget.clientWidth;
      update({ x: g.x + (e.clientX - g.px) * ratio, y: g.y + (e.clientY - g.py) * ratio });
    } else {
      const [a, b] = [...pointers.current.values()];
      update({ zoom: g.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / g.dist) });
    }
  }

  function onPointerUp(e) {
    pointers.current.delete(e.pointerId);
    startGesture();
  }

  function onKeyDown(e) {
    const step = e.shiftKey ? 80 : 20;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    update((p) => ({ x: p.x + move[0], y: p.y + move[1] }));
  }

  function chooseBackground(id) {
    // Si la foto tapa todo el cuadro, se achica para que el fondo elegido se vea.
    update((p) => (img && coversFrame(img, p) ? { bg: id, zoom: Math.min(0.85, fitZoom(img, p.rotation)), x: 0, y: 0 } : { bg: id }));
  }

  function finish() {
    if (!img) return;
    setBusy(true);
    try {
      const out = makeCanvas(OUT_W, OUT_H);
      paint(out, img, st);
      out.toBlob(
        (blob) => {
          setBusy(false);
          if (blob) onDone(blob);
          else setError("No se pudo preparar la foto. Probá de nuevo.");
        },
        // JPG de alta calidad como original: Cloudinary entrega AVIF o WebP según cada navegador.
        "image/jpeg",
        0.92
      );
    } catch {
      setBusy(false);
      setError("Esta foto no se puede editar desde acá. Subila de nuevo desde tu celular o compu.");
    }
  }

  const preview = product ? normalizeProduct("preview", product) : null;
  const atFit = img ? Math.abs(st.zoom - fitZoom(img, st.rotation)) < 0.01 : false;

  return (
    <Sheet
      open
      onClose={onCancel}
      title={title}
      editor
      footer={
        <div className={s.editorActions}>
          <button type="button" className={`btn btn-ghost ${s.resetBtn}`} onClick={() => update(DEFAULTS)} disabled={!img}>
            <Undo2 size={18} aria-hidden /> <span>Restablecer</span>
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={finish} disabled={!img || busy || Boolean(error)}>
            {busy ? "Preparando..." : "Usar foto"}
          </button>
        </div>
      }
    >
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : (
        <div className={s.editor}>
          <div className={s.editorStage}>
            <div className={s.frame}>
              <canvas
                ref={canvasRef}
                width={PREVIEW_W}
                height={(PREVIEW_W * OUT_H) / OUT_W}
                className={s.frameCanvas}
                tabIndex={0}
                role="application"
                aria-label="Foto. Arrastrá para encuadrar o usá las flechas del teclado."
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown}
              />
              {fullPreview || guide.w >= 1 ? null : (
                <span className={s.frameGuide} style={{ left: `${((1 - guide.w) / 2) * 100}%`, right: `${((1 - guide.w) / 2) * 100}%`, borderRadius: forma.round ? "50%" : undefined, border: forma.round ? "1px dashed rgba(253, 246, 240, 0.75)" : undefined }} aria-hidden />
              )}
              {!img ? <span className={s.frameLoading}>Cargando foto...</span> : null}
            </div>
            <p className={s.frameHint}>
              <Move size={14} aria-hidden /> {fullPreview ? "Arrastrá para mover. Todo el cuadro se ve en la tarjeta del inicio." : guide.w >= 1 ? "Arrastrá para mover. Toda la foto se ve en la carta." : `Arrastrá para mover. ${forma.round ? "El círculo" : "El recuadro"} es lo que se ve en la carta.`}
            </p>
          </div>

          <div className={s.editorPanel}>
            <div className={s.segmented} role="radiogroup" aria-label="Herramientas">
              {TABS.map(({ id, label, Icon }) => (
                <label key={id} className={s.segment}>
                  <input type="radio" name="editor-tab" checked={tab === id} onChange={() => setTab(id)} />
                  <span>
                    <Icon size={16} aria-hidden /> {label}
                  </span>
                </label>
              ))}
            </div>

            {tab === "encuadre" ? (
              <div className={s.toolPanel}>
                <div className={s.zoomRow}>
                  <button type="button" className={s.iconAction} onClick={() => update((p) => ({ zoom: p.zoom - 0.1 }))} aria-label="Alejar">
                    <ZoomOut size={20} aria-hidden />
                  </button>
                  <input
                    type="range"
                    min={img ? minZoom(img, st.rotation) : 0.15}
                    max={MAX_ZOOM}
                    step={0.01}
                    value={st.zoom}
                    onChange={(e) => update({ zoom: Number(e.target.value) })}
                    aria-label="Zoom"
                  />
                  <button type="button" className={s.iconAction} onClick={() => update((p) => ({ zoom: p.zoom + 0.1 }))} aria-label="Acercar">
                    <ZoomIn size={20} aria-hidden />
                  </button>
                </div>
                <div className={s.toolGrid}>
                  <button type="button" className={s.tool} aria-pressed={atFit} onClick={() => img && update((p) => ({ zoom: fitZoom(img, p.rotation), x: 0, y: 0 }))}>
                    <Shrink size={18} aria-hidden /> Foto completa
                  </button>
                  <button type="button" className={s.tool} aria-pressed={Math.abs(st.zoom - 1) < 0.01} onClick={() => update({ zoom: 1, x: 0, y: 0 })}>
                    <Expand size={18} aria-hidden /> Llenar cuadro
                  </button>
                  <button type="button" className={`${s.tool} ${s.toolWide}`} onClick={() => update((p) => ({ rotation: (p.rotation + 90) % 360, x: 0, y: 0 }))}>
                    <RotateCw size={18} aria-hidden /> Rotar 90°
                  </button>
                </div>
              </div>
            ) : null}

            {tab === "fondo" ? (
              <fieldset className={s.toolPanel}>
                <legend className="visually-hidden">Fondo de los espacios vacíos</legend>
                <div className={s.swatches}>
                  {BACKGROUNDS.map((b) => (
                    <label key={b.id} className={s.swatchOption}>
                      <input type="radio" name="editor-bg" checked={st.bg === b.id} onChange={() => chooseBackground(b.id)} />
                      <span
                        className={`${s.swatch} ${b.id === "blur" ? s.swatchBlur : ""}`}
                        style={b.id === "blur" ? undefined : { background: b.id === "custom" ? st.color : b.color }}
                        aria-hidden
                      >
                        {b.id === "blur" ? <ImageIcon size={18} /> : null}
                      </span>
                      <span className={s.swatchLabel}>{b.label}</span>
                    </label>
                  ))}
                </div>
                {st.bg === "custom" ? (
                  <label className={s.colorRow}>
                    <span>Elegí el color</span>
                    <input type="color" value={st.color} onChange={(e) => update({ color: e.target.value })} />
                  </label>
                ) : null}
                <p className="hint">El fondo se ve en los espacios que deja la foto al achicarla o moverla.</p>
              </fieldset>
            ) : null}

            {tab === "ajustes" ? (
              <div className={s.toolPanel}>
                {SLIDERS.map(({ key, label, Icon }) => (
                  <Slider key={key} label={label} Icon={Icon} value={st[key]} onChange={(v) => update({ [key]: v })} />
                ))}
              </div>
            ) : null}

            {renderPreview ? (
              <div className={s.editorPreview}>
                <p className={s.previewLabel}>Así se ve en el inicio</p>
                {renderPreview(thumbRef)}
              </div>
            ) : null}

            {preview ? (
              <div className={s.editorPreview}>
                <p className={s.previewLabel}>Así se ve en la carta</p>
                <div className={m.row}>
                  <div className={m.rowText}>
                    <p className={m.rowName}>{preview.nombre === "Sin nombre" ? "Nombre del producto" : preview.nombre}</p>
                    {preview.descripcion ? <p className={m.rowDesc}>{preview.descripcion}</p> : null}
                    <div className={m.rowMeta}>
                      <Price product={preview} />
                    </div>
                  </div>
                  <canvas
                    ref={thumbRef}
                    width={240}
                    height={Math.round((240 * 3) / (4 * guide.w))}
                    className={`${m.rowImg} ${s.previewThumb} ${s.shapeImg} ${s[`shape_${forma.id}`]}`}
                    style={{ aspectRatio: forma.ratio }}
                    aria-hidden
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </Sheet>
  );
}
