"use client"

import Link from "next/link"
import { MessageCircle, ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { WHATSAPP_LINK } from "@/lib/constants"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

export default function NotFound() {
  const { t } = useTranslation()
  const nf = t.notFound

  return (
    <>
      <SiteHeader />
      <main className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 py-24 text-center">
        <div className="absolute inset-0 bg-grid opacity-[0.35]" aria-hidden />
        <div
          className="absolute right-1/2 top-1/4 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <div className="font-display text-[120px] font-extrabold leading-none tracking-tight text-primary/10 sm:text-[160px]">
            {nf.number}
          </div>

          <div className="-mt-8 space-y-4">
            <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
              {nf.title}
            </h1>
            <p className="mx-auto max-w-md text-lg text-muted-foreground">
              {nf.description}
            </p>
          </div>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              <ArrowRight className="h-4 w-4" />
              {nf.backHome}
            </Link>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-7 text-base font-bold text-foreground transition-all hover:border-primary/40 hover:shadow-md"
            >
              <MessageCircle className="h-4 w-4" />
              {nf.contactUs}
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
