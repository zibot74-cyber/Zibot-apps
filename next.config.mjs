/** @type {import('next').NextConfig} */

const ContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // Fix 6a: أضاف accounts.google.com للـ script-src (Google Sign-In)
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://accounts.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self'",
  // Fix 6b: أضاف 'self' بشكل صريح + Google GSI + Vercel insights
  "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://accounts.google.com https://bot.zibot.app",
  // Fix 6c: أضاف accounts.google.com لـ frame-src (GSI one-tap popup)
  "frame-src 'self' https://accounts.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
  },
  { key: "X-XSS-Protection", value: "0" },
  // Fix 6d: same-origin → same-origin-allow-popups (يسمح لنوافذ Google OAuth)
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
]

const nextConfig = {
  poweredByHeader: false,
  env: {
    // رابط سيرفر البوت — يُستخدم في نافذة الدفع لإرسال طلبات الاشتراك
    NEXT_PUBLIC_BOT_URL: process.env.NEXT_PUBLIC_BOT_URL || '',
  },
  reactStrictMode: true,
  compress: true,

  // Fix 4: كان true → أخطاء TypeScript تُبنى بدون تحذير في production
  typescript: {
    ignoreBuildErrors: false,
  },

  // Suppress multiple-lockfiles workspace-root warning on Termux/Android
  outputFileTracingRoot: process.cwd(),

  images: {
    unoptimized: true,
    remotePatterns: [],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/:path*.(ico|png|jpg|jpeg|svg|webp|avif|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ]
  },
}

export default nextConfig
