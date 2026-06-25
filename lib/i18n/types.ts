// ─────────────────────────────────────────────────────────────────────────────
//  lib/i18n/types.ts
//  Shared TypeScript type definitions for translation objects.
// ─────────────────────────────────────────────────────────────────────────────

import type { Locale, Dir } from './index'

export interface PlanTranslation {
  name: string
  tagline: string
  price: string
  duration: string
  durationNote: string
  popular: boolean
  cta: string
  features: string[]
}

export interface VipPlanTranslation {
  name: string
  price: string
  duration: string
  description: string
}

export interface FooterLink {
  label: string
  href: string
  external?: boolean
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export interface Translations {
  meta: { lang: Locale; dir: Dir }

  nav: {
    howItWorks: string
    features: string
    pricing: string
    faq: string
    subscribe: string
    logoLabel: string
    openMenu: string
    closeMenu: string
    mainNav: string
    mobileNav: string
  }

  hero: {
    badge: string
    titlePart1: string
    titleHighlight: string
    titlePart2: string
    description: string
    startTrial: string
    subscribe: string
    stats: {
      avgResponse: { label: string; value: string }
      accuracy: { label: string; value: string }
      uptime: { label: string; value: string }
    }
  }

  features: {
    badge: string
    title: string
    items: Array<{ title: string; description: string }>
  }

  pricing: {
    badge: string
    title: string
    subtitle: string
    perMonth: string
    popular: string
    durationLabel: string
    freeTrial: {
      badge: string
      title: string
      description: string
      button: string
      note: string
    }
    plans: PlanTranslation[]
    vip: {
      badge: string
      title: string
      subtitle: string
      bestValue: string
      once: string
      continuousService: string
      subscribePrefix: string
      plans: VipPlanTranslation[]
    }
    footer: string
  }

  faq: {
    badge: string
    title: string
    subtitle: string
    items: Array<{ q: string; a: string }>
  }

  cta: {
    badge: string
    title: string
    subtitle: string
    button: string
    guarantees: string[]
  }

  footer: {
    tagline: string
    whatsappLabel: string
    copyright: string
    privacy: string
    terms: string
    columns: FooterColumn[]
  }

  settings: {
    badge: string
    title: string
    description: string
    appearanceLabel: string
    languageLabel: string
    supportLabel: string
    supportButton: string
    themes: { light: string; dark: string; system: string }
    languages: {
      ar: { name: string; description: string }
      en: { name: string; description: string }
    }
  }

  userMenu: {
    openMenu: string
    openMenuSr: string
    themeLight: string
    themeDark: string
    settingsLabel: string
    viewAccount: string
    signIn: string
    signOut: string
  }

  themeToggle: {
    enableLight: string
    enableDark: string
    titleLight: string
    titleDark: string
    srToggle: string
  }

  freeTrial: {
    badge: string
    title: string
    description: string
    howToScan: string
    directContact: string
  }

  whatsappSteps: {
    stepsLabel: string
    stepLabel: string
    stepOf: string
    stepBadge: string
    prev: string
    next: string
    steps: Array<{ title: string; description: string }>
  }

  whatsappFloat: {
    ariaLabel: string
    label: string
  }

  notFound: {
    number: string
    title: string
    description: string
    backHome: string
    contactUs: string
  }
}
