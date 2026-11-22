import AdminApp from "@/components/AdminApp";

export const instant = false;
export const metadata = { title: "Administración", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminApp />;
}
