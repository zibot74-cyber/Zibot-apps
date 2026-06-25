"use client"

import Link from "next/link"
import { ZIbotLogo } from "./zibot-logo"
import { WHATSAPP_LINK, WHATSAPP_NUMBER_DISPLAY } from "@/lib/constants"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

export function SiteFooter() {
  const { t } = useTranslation()
  const f = t.footer

  // Replace __WHATSAPP__ placeholder in column links with the real URL
  const resolvedColumns = f.columns.map((col) => ({
    ...col,
    links: col.links.map((link) => ({
      ...link,
      href: link.href === "__WHATSAPP__" ? WHATSAPP_LINK : link.href,
    })),
  }))

  const copyright = f.copyright.replace("{year}", String(new Date().getFullYear()))

  return (
    <footer className="border-t border-border bg-foreground text-background dark:bg-card dark:text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <ZIbotLogo variant="light" />
            <p className="mt-4 max-w-sm leading-relaxed text-background/70 dark:text-muted-foreground">
              {f.tagline}
            </p>
            <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-background/10 bg-background/5 px-4 py-3 dark:border-border dark:bg-secondary/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-background/60 dark:text-muted-foreground">
                {f.whatsappLabel}
              </span>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display font-bold text-background hover:text-accent dark:text-foreground dark:hover:text-primary"
                dir="ltr"
              >
                {WHATSAPP_NUMBER_DISPLAY}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {resolvedColumns.map((col) => (
              <div key={col.title}>
                <h4 className="font-display text-sm font-bold uppercase tracking-wider text-background dark:text-foreground">
                  {col.title}
                </h4>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="text-sm text-background/70 transition-colors hover:text-accent dark:text-muted-foreground dark:hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-background/10 pt-6 sm:flex-row sm:items-center dark:border-border">
          <p className="text-sm text-background/60 dark:text-muted-foreground">{copyright}</p>
          <div className="flex items-center gap-5 text-sm text-background/60 dark:text-muted-foreground">
            <Link href="/privacy" className="hover:text-accent dark:hover:text-primary">
              {f.privacy}
            </Link>
            <Link href="/terms" className="hover:text-accent dark:hover:text-primary">
              {f.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
