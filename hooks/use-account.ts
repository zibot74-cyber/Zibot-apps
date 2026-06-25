"use client"

import * as React from "react"

const STORAGE_KEY = "zibot:account"
const STORAGE_EVENT = "zibot:account:change"

export type Account = {
  id: string
  name: string
  email: string
  picture?: string
  provider: "google" | "local"
  createdAt: number
}

function readAccount(): Account | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Account
    if (!parsed?.id || !parsed?.email) return null
    return parsed
  } catch {
    return null
  }
}

function writeAccount(account: Account | null) {
  if (typeof window === "undefined") return
  if (account === null) {
    window.localStorage.removeItem(STORAGE_KEY)
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account))
  }
  // Notify other listeners in the same tab.
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT))
}

/**
 * Lightweight client-only account store backed by localStorage.
 * Persistent, real account state — works without any backend.
 */
export function useAccount() {
  const [account, setAccount] = React.useState<Account | null>(null)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setAccount(readAccount())
    setHydrated(true)

    const sync = () => setAccount(readAccount())
    window.addEventListener(STORAGE_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(STORAGE_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const signIn = React.useCallback((data: Omit<Account, "id" | "createdAt"> & Partial<Pick<Account, "id" | "createdAt">>) => {
    const next: Account = {
      id: data.id ?? crypto.randomUUID(),
      name: data.name,
      email: data.email,
      picture: data.picture,
      provider: data.provider,
      createdAt: data.createdAt ?? Date.now(),
    }
    writeAccount(next)
    setAccount(next)
    return next
  }, [])

  const signOut = React.useCallback(() => {
    writeAccount(null)
    setAccount(null)
  }, [])

  return { account, signIn, signOut, hydrated }
}
