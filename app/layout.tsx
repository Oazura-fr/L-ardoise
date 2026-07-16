import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  metadataBase: new URL("https://lardoise-ten.vercel.app"),
  title: "L'Ardoise — Prête à tes proches sans jamais te fâcher",
  description:
    "L'appli des potes qui se prêtent. Une reconnaissance de dette signée en un clic, une échéance, des relances qui évitent le malaise. Fun à utiliser, sérieuse sur le fond.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "L'Ardoise",
  },
  openGraph: {
    title: "L'Ardoise — Prête à tes proches sans jamais te fâcher",
    description:
      "Reconnaissance signée en un clic, relances sympas, tout est marqué sur l'ardoise. Personne n'oublie.",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/hero.png", width: 1200, height: 630, alt: "L'Ardoise" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "L'Ardoise — Prête à tes proches sans jamais te fâcher",
    description: "Reconnaissance signée en un clic, relances sympas. Personne n'oublie.",
    images: ["/hero.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#2c3142",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-body antialiased text-ink">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
