import QrPanel from "@/components/dashboard/QrPanel";

export const metadata = { title: "Código QR" };
// El panel espera la sesión en el navegador: Next no puede prerenderizar esta página para validarla.
export const instant = false;

export default function QrPage() {
  return <QrPanel />;
}
