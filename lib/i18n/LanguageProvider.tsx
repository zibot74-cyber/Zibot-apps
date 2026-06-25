'use client'

// ─────────────────────────────────────────────────────────────────────────────
//  lib/i18n/LanguageProvider.tsx
//  Client-side language context.  Reads from localStorage → navigator.language
//  → fallback 'ar'.  Updates <html lang> and <html dir> after mount without
//  causing a hydration mismatch (suppressHydrationWarning is set on <html>).
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { ar } from './translations/ar'
import { en } from './translations/en'
import {
  type Locale,
  DEFAULT_LOCALE,
  getDir,
  getStoredLocale,
  setStoredLocale,
  detectBrowserLocale,
} from './index'
import type { Translations } from './types'

const TRANSLATIONS: Record<Locale, Translations> = { ar, en }

interface LanguageContextValue {
  locale: Locale
  t: Translations
  setLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  t: ar,
  setLocale: () => undefined,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // SSR default: always Arabic — keeps metadata & SEO correct on first render.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // After mount: resolve from localStorage or navigator.language.
  useEffect(() => {
    const resolved = getStoredLocale() ?? detectBrowserLocale()
    if (resolved !== DEFAULT_LOCALE) {
      setLocaleState(resolved)
    }
  }, [])

  // Sync <html lang> and <html dir> whenever locale changes.
  useEffect(() => {
    const root = document.documentElement
    root.lang = locale
    root.dir = getDir(locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setStoredLocale(next)
    setLocaleState(next)
  }, [])

  const value: LanguageContextValue = {
    locale,
    t: TRANSLATIONS[locale],
    setLocale,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

/** Access translations and locale from any client component. */
export function useTranslation(): LanguageContextValue {
  return useContext(LanguageContext)
}
