"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { ZIbotLogo } from "./zibot-logo"
import { Button } from "@/components/ui/button"
import { UserMenu } from "./user-menu"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

export function SiteHeader() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const navItems = [
    { label: t.nav.howItWorks, href: "/#features" },
    { label: t.nav.features,   href: "/#features" },
    { label: t.nav.pricing,    href: "/#pricing" },
    { label: t.nav.faq,        href: "/#faq" },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        scrolled
          ? "border-b border-border/60 bg-background/85 backdrop-blur-xl shadow-sm shadow-foreground/[0.02]"
          : "border-b border-transparent bg-background/60 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center" aria-label={t.nav.logoLabel}>
          <ZIbotLogo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={t.nav.mainNav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild size="sm" className="font-bold shadow-sm shadow-primary/20">
            <Link href="/#pricing">{t.nav.subscribe}</Link>
          </Button>
          <UserMenu />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <UserMenu />
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden border-t border-border/60 bg-background md:hidden",
          open ? "max-h-[80vh]" : "max-h-0 border-t-transparent",
          "transition-[max-height] duration-300",
        )}
      >
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4" aria-label={t.nav.mobileNav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild className="mt-2 h-11 font-bold">
            <Link href="/#pricing" onClick={() => setOpen(false)}>
              {t.nav.subscribe}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
