import { redirect } from "next/navigation";

// Los horarios ahora viven dentro de Datos del local; se conserva la dirección anterior.
export const instant = false;

export default async function HorariosPage({ params }) {
  const { local } = await params;
  redirect(`/panel/${local}/datos#horarios`);
}
