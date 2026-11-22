import LoginForm from "@/components/LoginForm";
import SiteHeader from "@/components/site/SiteHeader";
import s from "@/components/panel.module.css";

export const instant = false;
export const metadata = { title: "Ingresar", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <div className={s.loginLayout}>
      <SiteHeader showLogin={false} />
      <LoginForm />
    </div>
  );
}
