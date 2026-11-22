"use client";
import { useRef, useState } from "react";
import { ImagePlus, Link2, Pencil, Trash2 } from "lucide-react";
import ProductImage from "@/components/menu/ProductImage";
import { discardImage } from "@/lib/admin-data";
import { IMAGE_ACCEPT, MAX_BYTES, canOpenInBrowser, cloudinaryConfigured, directImageUrl, uploadImage, validateImageFile, verifyImage } from "@/lib/cloudinary-client";
import PhotoEditor from "./PhotoEditor";
import s from "./dashboard.module.css";

export default function ImageUploader({ value, onChange, local, product }) {
  const input = useRef(null);
  const [source, setSource] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [checking, setChecking] = useState(false);
  const [over, setOver] = useState(false);
  const canUpload = cloudinaryConfigured();
  const [converting, setConverting] = useState(false);
  const uploading = progress !== null || converting;

  async function pick(f) {
    const err = validateImageFile(f);
    setError(err);
    if (err) return;
    setConverting(true);
    try {
      if (await canOpenInBrowser(f)) {
        setSource({ file: f });
        return;
      }
      // Formatos que el navegador no abre (HEIC, TIFF, RAW...): los convierte Cloudinary.
      if (f.size > MAX_BYTES) {
        setError("Este formato se convierte en la nube y admite hasta 10 MB. Probá con una foto más liviana.");
        return;
      }
      setProgress(0);
      const url = await uploadImage(f, local, setProgress);
      setSource({ src: url, temp: url });
    } catch {
      setError("No pudimos convertir esa imagen. Probá exportarla como JPG o PNG.");
    } finally {
      setConverting(false);
      setProgress(null);
    }
  }

  function closeEditor() {
    if (source?.temp) discardImage(local, source.temp);
    setSource(null);
  }

  async function upload(blob) {
    const temp = source?.temp;
    setSource(null);
    setError("");
    setProgress(0);
    try {
      const url = await uploadImage(blob, local, setProgress);
      onChange(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setProgress(null);
      if (temp) discardImage(local, temp);
    }
  }

  async function useLink() {
    const url = directImageUrl(link);
    if (!/^https:\/\//i.test(url)) {
      setError("Pegá un link que empiece con https://");
      return;
    }
    setChecking(true);
    const ok = await verifyImage(url);
    setChecking(false);
    if (!ok) {
      setError("Ese link no carga como imagen. Si es de Google Drive, compartilo como \"Cualquiera con el enlace\".");
      return;
    }
    setError("");
    setLink("");
    onChange(url);
  }

  return (
    <div className={s.uploader}>
      <div
        className={`${s.drop} ${over ? s.dropOver : ""}`}
        onDragOver={(e) => {
          if (!canUpload) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (!canUpload) return;
          e.preventDefault();
          setOver(false);
          pick(e.dataTransfer.files?.[0]);
        }}
      >
        {value ? (
          <ProductImage src={value} alt="Foto actual" width={640} ratio="4 / 3" className={s.dropImg} />
        ) : canUpload ? (
          <button type="button" className={s.dropEmpty} onClick={() => input.current?.click()} disabled={uploading}>
            <ImagePlus size={32} aria-hidden />
            <strong>Elegí una foto</strong>
            <span>o arrastrala acá. Sirve cualquier formato, también HEIC del iPhone.</span>
          </button>
        ) : (
          <div className={s.dropEmpty}>
            <ImagePlus size={32} aria-hidden />
            <span>Pegá el link de una foto</span>
          </div>
        )}
        {uploading ? (
          <div className={s.progress} role="progressbar" aria-valuenow={progress ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label="Procesando foto">
            <span style={{ width: `${progress ?? 0}%` }} />
            <em>{converting ? "Preparando" : "Subiendo"}{progress !== null ? ` ${progress}%` : "..."}</em>
          </div>
        ) : null}
      </div>

      {canUpload ? (
        <input
          ref={input}
          type="file"
          accept={IMAGE_ACCEPT}
          hidden
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      ) : null}

      {value ? (
        <div className={s.uploaderActions}>
          {canUpload ? (
            <button type="button" className="btn btn-primary" onClick={() => setSource({ src: value })} disabled={uploading}>
              <Pencil size={17} aria-hidden /> Editar foto
            </button>
          ) : null}
          {canUpload ? (
            <button type="button" className="btn btn-ghost" onClick={() => input.current?.click()} disabled={uploading}>
              <ImagePlus size={18} aria-hidden /> Cambiar
            </button>
          ) : null}
          <button type="button" className="btn btn-ghost" onClick={() => onChange("")} disabled={uploading}>
            <Trash2 size={18} aria-hidden /> Quitar
          </button>
        </div>
      ) : null}

      <details className={s.linkBox} open={!canUpload || undefined}>
        <summary>Usar un link (sirve Google Drive)</summary>
        <div className={s.linkRow}>
          <label className="field" style={{ flex: 1 }}>
            <span className="visually-hidden">Link de la foto</span>
            <input className="input" type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
          </label>
          <button type="button" className="btn btn-ghost" onClick={useLink} disabled={!link.trim() || checking}>
            <Link2 size={18} aria-hidden /> {checking ? "Verificando" : "Usar"}
          </button>
        </div>
      </details>

      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}

      {source ? <PhotoEditor source={source} product={product} onCancel={closeEditor} onDone={upload} /> : null}
    </div>
  );
}
