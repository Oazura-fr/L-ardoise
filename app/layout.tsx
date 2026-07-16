import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "L'Ardoise — La reconnaissance de dette entre proches",
  description:
    "Prête à tes proches sans te fâcher. Reconnaissance signée, échéance, relances : tout est marqué sur l'ardoise, personne n'oublie.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
