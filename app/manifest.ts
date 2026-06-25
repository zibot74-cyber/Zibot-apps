// Next.js Metadata route: serves /manifest.webmanifest
import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZIbot — مساعد ذكي للرد على عملاء واتساب",
    short_name: "ZIbot",
    description: "ذكاء اصطناعي يرد على عملاء واتساب فوراً وعلى مدار الساعة.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf5",
    theme_color: "#0a5240",
    lang: "ar",
    dir: "rtl",
    // ✅ FIX: icons تشير لملفات موجودة فعلاً في public/
    icons: [
      { src: "/icon.svg",           sizes: "any",     type: "image/svg+xml", purpose: "any" },
      { src: "/icon-light-32x32.png", sizes: "32x32", type: "image/png",     purpose: "any" },
      { src: "/apple-icon.png",     sizes: "180x180", type: "image/png",     purpose: "any" },
    ],
  }
}
