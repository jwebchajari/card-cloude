import ProductList from "@/components/dashboard/ProductList";

// El panel espera la sesión en el navegador: Next no puede prerenderizar esta página para validarla.
export const instant = false;

export default function LocalPage() {
  return <ProductList />;
}
