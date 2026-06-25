import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/constants"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    // Fix 5: حُذفت /#pricing /#features /#faq — محركات البحث تتجاهل # في URLs
    // الحل: الصفحة الرئيسية فقط + الصفحات الحقيقية القابلة للفهرسة
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: {
          ar: SITE_URL,
          en: `${SITE_URL}?lang=en`,
        },
      },
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ]
}
