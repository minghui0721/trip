import type { MetadataRoute } from "next";

// Lets people "Add to Home Screen" and open Trip full screen, like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jalan Jalan",
    short_name: "Jalan Jalan",
    description: "Plan trips together with your friends.",
    start_url: "/",
    display: "standalone",
    background_color: "#121212",
    theme_color: "#121212",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
