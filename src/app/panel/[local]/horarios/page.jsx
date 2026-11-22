import HorariosForm from "@/components/dashboard/HorariosForm";

export const metadata = { title: "Horarios" };
// El panel espera la sesión en el navegador: Next no puede prerenderizar esta página para validarla.
export const instant = false;

export default function HorariosPage() {
  return <HorariosForm />;
}
