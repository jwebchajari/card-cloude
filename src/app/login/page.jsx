import LoginForm from "@/components/LoginForm";

export const instant = false;
export const metadata = { title: "Ingresar", robots: { index: false, follow: false } };

export default function LoginPage() {
  return <LoginForm />;
}
