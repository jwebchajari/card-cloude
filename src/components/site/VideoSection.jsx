import { MessageCircle } from "lucide-react";
import { VIDEO } from "@/lib/home-media";
import landing from "@/app/landing.module.css";
import s from "./home.module.css";

export default function VideoSection({ cta }) {
  return (
    <section id="video" className={`${landing.section} ${s.videoSection}`}>
      <div>
        <h2>Mirá cómo compran tus clientes</h2>
        <p className={s.intro}>En 28 segundos ves el recorrido completo, desde que escanean tu QR hasta que instalan la app de tu local.</p>
        <a href={cta} className={`btn btn-primary ${s.cta}`} {...(cta.startsWith("https://wa.me/") ? { "data-track": "whatsapp", target: "_blank", rel: "noopener noreferrer" } : {})}>
          <MessageCircle size={18} aria-hidden /> Consultar precio por WhatsApp
        </a>
      </div>
      <video
        className={s.video}
        controls
        playsInline
        preload="none"
        width={1080}
        height={1920}
        poster={VIDEO.poster}
        aria-label={VIDEO.description}
      >
        <source src={VIDEO.src} type="video/mp4" />
      </video>
    </section>
  );
}
