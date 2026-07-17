import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "L'Ardoise",
    short_name: "L'Ardoise",
    description: "La reconnaissance de dette entre proches — signée, datée, jamais oubliée.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#f6f0e1",
    theme_color: "#2c3142",
    lang: "fr",
    icons: [
      // "any" = l'icône telle quelle ; "maskable" = version avec marge de sécurité,
      // sinon Android rogne les bords en appliquant son masque rond/squircle.
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
