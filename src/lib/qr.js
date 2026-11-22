import qrcode from "qrcode-generator";

export const QR_MARGIN = 4; // zona blanca que exige el estándar para escanear bien

/** Matriz del QR con corrección media: tolera marcas de impresión sin volverse muy denso. */
export function qrMatrix(text) {
  const qr = qrcode(0, "M");
  qr.addData(text, "Byte");
  qr.make();
  const count = qr.getModuleCount();
  return { count, isDark: (row, col) => qr.isDark(row, col) };
}

export function qrPath({ count, isDark }) {
  let d = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (isDark(row, col)) d += `M${col + QR_MARGIN} ${row + QR_MARGIN}h1v1h-1z`;
    }
  }
  return d;
}

export function qrSvg(matrix) {
  const size = matrix.count + QR_MARGIN * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path fill="#000" d="${qrPath(matrix)}"/></svg>`;
}

/** Dibuja el QR con módulos enteros para que los bordes queden nítidos al imprimir. */
export function drawQr(ctx, matrix, x, y, maxSize) {
  const total = matrix.count + QR_MARGIN * 2;
  const unit = Math.floor(maxSize / total);
  const size = unit * total;
  const left = Math.round(x + (maxSize - size) / 2);
  const top = Math.round(y + (maxSize - size) / 2);
  ctx.fillStyle = "#fff";
  ctx.fillRect(left, top, size, size);
  ctx.fillStyle = "#000";
  for (let row = 0; row < matrix.count; row++) {
    for (let col = 0; col < matrix.count; col++) {
      if (matrix.isDark(row, col)) ctx.fillRect(left + (col + QR_MARGIN) * unit, top + (row + QR_MARGIN) * unit, unit, unit);
    }
  }
}

export function downloadBlob(blob, filename) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
