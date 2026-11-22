"use client";
import { CLOUDINARY_ROOT } from "./catalogo";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
export const MAX_BYTES = 10 * 1024 * 1024; // límite para subir un original a Cloudinary
const MAX_INPUT_BYTES = 60 * 1024 * 1024; // límite para abrir una foto en el navegador
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "jfif", "png", "webp", "avif", "gif", "bmp", "svg", "tif", "tiff", "heic", "heif", "ico", "psd", "dng", "raw", "cr2", "cr3", "nef", "arw", "orf", "rw2"];
// Algunos formatos llegan sin tipo MIME (HEIC en Windows, RAW), por eso también se aceptan por extensión.
export const IMAGE_ACCEPT = `image/*,${IMAGE_EXTENSIONS.map((e) => `.${e}`).join(",")}`;

export function cloudinaryConfigured() {
  return Boolean(CLOUD && PRESET);
}

function fileExtension(file) {
  return String(file?.name || "").split(".").pop().toLowerCase();
}

export function validateImageFile(file) {
  if (!file) return "Elegí una imagen.";
  if (!/^image\//i.test(file.type) && !IMAGE_EXTENSIONS.includes(fileExtension(file))) return "Ese archivo no es una imagen.";
  if (file.size > MAX_INPUT_BYTES) return "La imagen pesa más de 60 MB.";
  return "";
}

/** true si este navegador puede abrir la imagen sin convertirla. */
export function canOpenInBrowser(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const done = (ok) => {
      URL.revokeObjectURL(url);
      resolve(ok);
    };
    img.onload = () => done(img.naturalWidth > 0 && img.naturalHeight > 0);
    img.onerror = () => done(false);
    img.src = url;
  });
}

/** Subida unsigned con progreso a <ROOT>/<local>. Devuelve la secure_url. */
export function uploadImage(blob, local, onProgress) {
  return new Promise((resolve, reject) => {
    if (!cloudinaryConfigured()) {
      reject(new Error("Cloudinary no está configurado."));
      return;
    }
    if (blob.size > MAX_BYTES) {
      reject(new Error("La foto pesa más de 10 MB."));
      return;
    }
    const form = new FormData();
    // Nombre único: el preset usa el nombre del archivo y un upload unsigned no puede pisar
    // uno existente (devuelve la foto vieja). Sin esto todas las fotos se llamaban "blob".
    const ext = fileExtension(blob) || (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const name = `foto-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    form.append("file", blob, name);
    form.append("upload_preset", PRESET);
    form.append("folder", `${CLOUDINARY_ROOT}/${local}`);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) resolve(res.secure_url);
        else reject(new Error(res?.error?.message || "No se pudo subir la foto."));
      } catch {
        reject(new Error("No se pudo subir la foto."));
      }
    };
    xhr.onerror = () => reject(new Error("Sin conexión. Probá de nuevo."));
    xhr.send(form);
  });
}

/** Convierte links de Google Drive a URL directa de imagen. Otros links pasan igual. */
export function directImageUrl(raw) {
  const s = String(raw || "").trim();
  if (!/drive\.google\.com|docs\.google\.com/.test(s)) return s;
  const id = s.match(/\/d\/([\w-]{10,})/)?.[1] || s.match(/[?&]id=([\w-]{10,})/)?.[1];
  return id ? `https://lh3.googleusercontent.com/d/${id}=w1600` : s;
}

/** Verifica que la URL cargue como imagen. */
export function verifyImage(url, timeout = 10000) {
  return new Promise((resolve) => {
    const img = new Image();
    const t = setTimeout(() => resolve(false), timeout);
    img.onload = () => {
      clearTimeout(t);
      resolve(img.naturalWidth > 0);
    };
    img.onerror = () => {
      clearTimeout(t);
      resolve(false);
    };
    img.src = url;
  });
}
