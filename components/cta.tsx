"use client"

import { ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

export function CTA() {
  const { t } = useTranslation()
  const c = t.cta

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary p-8 text-primary-foreground sm:p-12 lg:p-16">
          {/* Decorative shapes */}
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/25 blur-3xl" aria-hidden />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary-foreground/5 blur-3xl" aria-hidden />
          <div className="absolute inset-0 bg-grid opacity-[0.08]" aria-hidden />

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-bold text-accent">
              {c.badge}
            </div>
            <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl whitespace-pre-line">
              {c.title}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-primary-foreground/85 text-pretty">
              {c.subtitle}
            </p>

            <div className="mt-8 flex items-center justify-center">
              <Button
                asChild
                size="lg"
                className="h-14 bg-accent px-8 text-base font-bold text-accent-foreground shadow-2xl shadow-accent/30 transition-transform hover:scale-[1.03] hover:bg-accent/95 active:scale-[0.98]"
              >
                <a href="#pricing">
                  {c.button}
                  <ArrowLeft className="h-5 w-5" />
                </a>
              </Button>
            </div>

            <ul className="mx-auto mt-8 flex flex-col items-center justify-center gap-3 text-sm text-primary-foreground/85 sm:flex-row sm:gap-6">
              {c.guarantees.map((g) => (
                <li key={g} className="inline-flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/25 text-accent">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
