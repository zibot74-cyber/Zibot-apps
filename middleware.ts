// middleware.ts — Next.js Edge Middleware
// يعمل على Edge Runtime قبل أي rendering أو API route
// يحمي المسارات الحساسة ويمنع الوصول المباشر

import { NextRequest, NextResponse } from "next/server"

// ── المسارات الحساسة التي يجب حجبها عن الزواحف ──────────────────
const BLOCKED_SENSITIVE_PATHS = [
  "/.env",
  "/.git",
  "/admin",
  "/wp-admin",
  "/phpinfo",
  "/.htaccess",
  "/server-status",
  "/web.config",
  "/.ssh",
]

// ── User-agents الضارة ────────────────────────────────────────────
const MALICIOUS_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /nessus/i,
  /masscan/i,
  /nuclei/i,
  /acunetix/i,
  /dirbuster/i,
  /gobuster/i,
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ua = request.headers.get("user-agent") || ""

  // ─── حجب User-agents الضارة ───────────────────────────────────
  if (MALICIOUS_UA_PATTERNS.some((p) => p.test(ua))) {
    return new NextResponse(null, { status: 403 })
  }

  // ─── حجب المسارات الحساسة ─────────────────────────────────────
  const lp = pathname.toLowerCase()
  if (BLOCKED_SENSITIVE_PATHS.some((b) => lp.startsWith(b) || lp.includes(b))) {
    return new NextResponse(null, { status: 403 })
  }

  // ─── منع الوصول المباشر لملفات hidden (.xxx) ──────────────────
  const fileName = pathname.split("/").pop() || ""
  if (fileName.startsWith(".") && fileName !== ".well-known") {
    return new NextResponse(null, { status: 403 })
  }

  // ─── السماح للطلب بالمرور ──────────────────────────────────────
  // ملاحظة: كل الـ security headers (CSP, HSTS, Referrer-Policy,
  // Permissions-Policy, X-Frame-Options, إلخ) تُضبط مركزياً في
  // next.config.mjs (headers()) فقط. كانت تُضبط هنا أيضاً بقيم
  // أقدم وناقصة (كانت بتلغي إصلاحات Google Sign-In و Vercel
  // Analytics المطبّقة في next.config.mjs) — تمت إزالتها لتفادي
  // التعارض. هذا الملف مسؤول فقط عن حجب الزواحف/المسارات الحساسة.
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|svg|webp|woff2|woff|ttf|eot|css|js)$).*)",
  ],
}
