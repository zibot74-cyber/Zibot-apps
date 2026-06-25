"use client"

import { WHATSAPP_LINK } from "@/lib/constants"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

export function WhatsappFloat() {
  const { t } = useTranslation()

  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.whatsappFloat.ariaLabel}
      // ✅ FIX: استخدام end-5 بدل left-5 ليعمل صح في العربي (RTL) والإنجليزي (LTR)
      className="fixed bottom-5 end-5 z-50 group inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-2xl shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90"
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        <span className="absolute h-full w-full animate-ping rounded-full bg-accent/60 opacity-75" />
        <svg viewBox="0 0 32 32" className="relative h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M16 3C8.82 3 3 8.82 3 16c0 2.3.6 4.46 1.66 6.34L3 29l6.83-1.62A12.96 12.96 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3Zm5.96 15.65c-.33-.16-1.94-.96-2.24-1.07-.3-.11-.52-.17-.74.17-.22.33-.85 1.07-1.04 1.29-.19.22-.39.25-.72.08-.33-.16-1.39-.51-2.65-1.64a9.96 9.96 0 0 1-1.84-2.29c-.19-.33-.02-.5.14-.67.15-.15.33-.39.5-.58.16-.19.22-.33.33-.55.11-.22.06-.41-.03-.58-.08-.17-.74-1.78-1.01-2.43-.27-.65-.54-.56-.74-.57h-.63c-.22 0-.58.08-.88.41s-1.15 1.12-1.15 2.73c0 1.61 1.18 3.17 1.34 3.39.16.22 2.32 3.54 5.62 4.96.79.34 1.4.54 1.88.7.79.25 1.5.21 2.07.13.63-.09 1.94-.79 2.21-1.56.27-.77.27-1.42.19-1.56-.08-.14-.3-.22-.63-.39Z" />
        </svg>
      </span>
      <span className="hidden text-sm font-bold sm:inline">{t.whatsappFloat.label}</span>
    </a>
  )
}
