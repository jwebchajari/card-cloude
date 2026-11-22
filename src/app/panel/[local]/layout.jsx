import { Suspense } from "react";
import Loading from "@/components/Loading";
import DashboardShell from "@/components/dashboard/DashboardShell";

// El shell lee el slug con useParams(): va dentro de Suspense para que la ruta tenga shell estático.
export default function LocalLayout({ children }) {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
