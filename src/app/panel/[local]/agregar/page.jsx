import ComidaForm from "@/components/dashboard/ComidaForm";

export const metadata = { title: "Agregar producto" };
// El panel espera la sesión en el navegador: Next no puede prerenderizar esta página para validarla.
export const instant = false;

export default function AgregarPage() {
  return <ComidaForm />;
}
