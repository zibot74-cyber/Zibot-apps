import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SITE_URL, WHATSAPP_NUMBER } from "@/lib/constants"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/lib/i18n/LanguageProvider"
import "./globals.css"


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ZIbot — رد على كل عميل في أقل من ٨ ثوانٍ، بدون توظيف",
    template: "%s | ZIbot",
  },
  description:
    "ZIbot هو مساعد ذكاء اصطناعي يرد على عملاء متجرك على واتساب فوراً وعلى مدار الساعة، بدقة ٩٨٪ ومتوسط استجابة ٢.٣ ثانية. وفّر تكاليف موظفي الدعم وابدأ من ٥ دولارات شهرياً، أو جرّب مجاناً بدون أي بطاقة.",
  applicationName: "ZIbot",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  authors: [{ name: "ZIbot" }],
  creator: "ZIbot",
  publisher: "ZIbot",
  keywords: [
    "ZIbot",
    "زي بوت",
    "ذكاء اصطناعي",
    "خدمة عملاء",
    "خدمة عملاء واتساب",
    "بوت واتساب",
    "WhatsApp AI",
    "AI customer support",
    "أتمتة الردود",
    "متاجر إلكترونية",
    "شات بوت عربي",
    "Arabic chatbot",
    "مساعد ذكي",
    "رد آلي",
    "تيليجرام",
    "ماسنجر",
  ],
  category: "technology",
  // Google Search Console verification
  // أضف verification code الخاص بك هنا بعد التحقق من Google Search Console
  // verification: { google: "YOUR_GOOGLE_VERIFICATION_CODE" },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "ar-EG": SITE_URL,
      "ar":    SITE_URL,
      "en":    `${SITE_URL}?lang=en`,
      "x-default": SITE_URL,
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: SITE_URL,
    siteName: "ZIbot",
    title: "ZIbot — رد على كل عميل في أقل من ٨ ثوانٍ، بدون توظيف",
    description:
      "وفّر تكاليف موظفي خدمة العملاء واترك ZIbot يرد على عملاء واتساب فوراً وعلى مدار الساعة. ابدأ مجاناً بـ ٣ رسائل تجريبية.",
    images: [
      {
        // Fix 13: URL مطلق — بعض crawlers (LinkedIn, WhatsApp) تتجاهل metadataBase
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "ZIbot — ذكاء اصطناعي للرد على عملاء واتساب",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZIbot — رد على كل عميل في أقل من ٨ ثوانٍ",
    description:
      "مساعد ذكاء اصطناعي يرد على عملاء واتساب فوراً، يبدأ من ٥$ شهرياً. جرّبه مجاناً.",
    // Fix 13b: URL مطلق للـ Twitter card
    images: [`${SITE_URL}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-light-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf5" },
    { media: "(prefers-color-scheme: dark)", color: "#0e2520" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

// JSON-LD structured data: Organization + Software + Product + FAQ
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "ZIbot",
      alternateName: "زي بوت",
      url: SITE_URL,
      logo: {
        // Fix 11: Schema.org يشترط logo ≥ 112×112 — icon-light-32x32.png كان أصغر من الحد
        "@type": "ImageObject",
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
      },
      image: `${SITE_URL}/og-image.jpg`,
      description:
        "ZIbot هو مساعد ذكاء اصطناعي يرد على عملاء واتساب فوراً وعلى مدار الساعة، بأسعار تبدأ من ٥ دولارات شهرياً.",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: WHATSAPP_NUMBER,
        contactType: "customer support",
        availableLanguage: ["Arabic", "English"],
        areaServed: ["EG", "SA", "AE", "KW", "QA", "BH", "OM", "JO", "MA", "DZ", "TN", "LY", "IQ", "YE"],
      },
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "ZIbot",
      inLanguage: "ar",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: "ZIbot",
      operatingSystem: "Web, WhatsApp",
      applicationCategory: "BusinessApplication",
      offers: [
        { "@type": "Offer", name: "البداية", price: "5", priceCurrency: "USD" },
        { "@type": "Offer", name: "النمو", price: "15", priceCurrency: "USD" },
        { "@type": "Offer", name: "الاحترافي", price: "20", priceCurrency: "USD" },
        { "@type": "Offer", name: "VIP", price: "50", priceCurrency: "USD" },
        { "@type": "Offer", name: "VIP PRO", price: "80", priceCurrency: "USD" },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "127",
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className="bg-background"
      suppressHydrationWarning
    >
      {/*
        ── Anti-flicker scripts ──────────────────────────────────────────────
        Both scripts run synchronously before paint so there is zero flash.
        They are inlined (no src, no defer, no async) intentionally.
        CSP note: next-themes already requires 'unsafe-inline' for its own
        inline script; these are equally safe and equally static.
      */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
        {/* 1. Theme: apply class before first paint to avoid white flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('zibot-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s!=='light'&&d)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        {/* 2. Language: set lang+dir before first paint to avoid layout shift */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem('zibot-lang');if(!l){var n=navigator.language||'';if(n.startsWith('en'))l='en';else l='ar';}if(l==='en'){document.documentElement.lang='en';document.documentElement.dir='ltr';}else{document.documentElement.lang='ar';document.documentElement.dir='rtl';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange={false}
            storageKey="zibot-theme"
          >
            {children}
          </ThemeProvider>
        </LanguageProvider>
        {/* JSON-LD structured data. Rendered inside <body> for stable hydration in React 19. */}
        <script
          type="application/ld+json"
          // Safe: static, server-rendered, no user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
