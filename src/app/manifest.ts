import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lebens-Optimierer",
    short_name: "Optimierer",
    description: "Selbstverständnis, Geschäftsfelder, Lebensausrichtung und finanzielle Freiheit.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1117",
    theme_color: "#0f1117",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
