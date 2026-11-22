import EditarComida from "@/components/dashboard/EditarComida";

export const metadata = { title: "Editar producto" };
// El panel espera la sesión en el navegador: Next no puede prerenderizar esta página para validarla.
export const instant = false;

export default function EditarPage() {
  return <EditarComida />;
}
