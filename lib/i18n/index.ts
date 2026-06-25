// ─────────────────────────────────────────────────────────────────────────────
//  lib/i18n/index.ts
//  Core i18n types and locale-detection utilities.
//  No external dependencies — works in both client and server contexts.
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = 'ar' | 'en'
export type Dir = 'rtl' | 'ltr'

/** Supported locales. Arabic is the canonical default for SSR. */
export const SUPPORTED_LOCALES: Locale[] = ['ar', 'en']
export const DEFAULT_LOCALE: Locale = 'ar'
export const LOCALE_STORAGE_KEY = 'zibot-lang'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale)
}

/** Map locale → document direction. */
export function getDir(locale: Locale): Dir {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

/**
 * Read stored locale from localStorage.
 * Returns null on SSR or if nothing is stored.
 */
export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(v) ? v : null
  } catch {
    return null
  }
}

/** Persist locale preference to localStorage. */
export function setStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // quota exceeded or private-browsing restriction — fail silently
  }
}

/**
 * Detect the user's preferred locale from navigator.language.
 * Falls back to DEFAULT_LOCALE when no match is found.
 */
export function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined' || !navigator?.language) return DEFAULT_LOCALE
  const tag = navigator.language.toLowerCase()
  if (tag.startsWith('ar')) return 'ar'
  if (tag.startsWith('en')) return 'en'
  return DEFAULT_LOCALE
}

/**
 * Resolve the active locale with priority:
 *   1. localStorage (user's explicit choice)
 *   2. navigator.language (browser preference)
 *   3. DEFAULT_LOCALE (fallback)
 */
export function resolveLocale(): Locale {
  return getStoredLocale() ?? detectBrowserLocale()
}
