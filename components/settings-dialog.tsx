"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun, Sparkles, MessageCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { WHATSAPP_LINK } from "@/lib/constants"
import { useTranslation } from "@/lib/i18n/LanguageProvider"
import type { Locale } from "@/lib/i18n/index"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme()
  const { t, locale, setLocale } = useTranslation()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const activeTheme = mounted ? theme ?? "system" : "system"

  const themes = [
    { value: "light",  label: t.settings.themes.light,  Icon: Sun },
    { value: "dark",   label: t.settings.themes.dark,   Icon: Moon },
    { value: "system", label: t.settings.themes.system, Icon: Monitor },
  ] as const

  const languages: Array<{ value: Locale; name: string; description: string }> = [
    { value: "ar", ...t.settings.languages.ar },
    { value: "en", ...t.settings.languages.en },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t.settings.badge}
          </div>
          <DialogTitle className="text-2xl">{t.settings.title}</DialogTitle>
          <DialogDescription>{t.settings.description}</DialogDescription>
        </DialogHeader>

        {/* Appearance */}
        <section className="mt-2">
          <h3 className="mb-2 text-sm font-bold text-foreground">{t.settings.appearanceLabel}</h3>
          <div className="grid grid-cols-3 gap-2">
            {themes.map(({ value, label, Icon }) => {
              const isActive = activeTheme === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card px-3 py-4 text-sm font-bold transition-all",
                    isActive
                      ? "border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Language */}
        <section className="mt-4">
          <h3 className="mb-2 text-sm font-bold text-foreground">{t.settings.languageLabel}</h3>
          <div className="grid grid-cols-2 gap-2">
            {languages.map((lang) => {
              const isActive = locale === lang.value
              return (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => setLocale(lang.value)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-2xl border bg-card px-4 py-3 text-start transition-all",
                    isActive
                      ? "border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <span className="font-display font-bold">{lang.name}</span>
                  <span className="text-xs leading-tight opacity-70">{lang.description}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Support */}
        <section className="mt-4">
          <h3 className="mb-2 text-sm font-bold text-foreground">{t.settings.supportLabel}</h3>
          <Button asChild variant="outline" className="h-11 w-full font-bold">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              {t.settings.supportButton}
            </a>
          </Button>
        </section>
      </DialogContent>
    </Dialog>
  )
}
