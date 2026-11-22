import DatosLocal from "@/components/dashboard/DatosLocal";

export const metadata = { title: "Datos del local" };
// El panel espera la sesión en el navegador: Next no puede prerenderizar esta página para validarla.
export const instant = false;

export default function DatosPage() {
  return <DatosLocal />;
}
