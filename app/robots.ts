import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/constants"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── بوتات Googlebot و Bingbot لها وصول كامل للصفحات العامة
      {
        userAgent: ["Googlebot", "Bingbot", "Slurp"],
        allow: ["/", "/privacy", "/terms"],
        disallow: [
          "/api/",
          "/_next/",
          "/*.json$",
          "/*.xml$",
        ],
      },
      // ── بقية البوتات — نفس الصلاحيات
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/terms"],
        disallow: [
          "/api/",
          "/_next/",
          "/*.json$",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
