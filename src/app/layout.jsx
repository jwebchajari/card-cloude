import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { SEO_TITLE } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });
const fullTitle = `${SEO_TITLE} | ${SITE_NAME}`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: fullTitle, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "food",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: { type: "website", locale: "es_AR", url: "/", siteName: SITE_NAME, title: fullTitle, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: fullTitle, description: SITE_DESCRIPTION },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport = { themeColor: "#0b0a08", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="es-AR" className={`${bricolage.variable} ${instrument.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
