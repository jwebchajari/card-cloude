import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | Carta online con pedidos por WhatsApp`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "es_AR", url: "/", siteName: SITE_NAME, title: SITE_NAME, description: SITE_DESCRIPTION },
};

export const viewport = { themeColor: "#0b0a08", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="es-AR" className={`${bricolage.variable} ${instrument.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
