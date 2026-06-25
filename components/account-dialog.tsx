"use client"

import * as React from "react"
import Script from "next/script"
import { LogOut, ShieldCheck, UserRound, Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAccount, type Account } from "@/hooks/use-account"
import { cn } from "@/lib/utils"

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon"
              theme?: "outline" | "filled_blue" | "filled_black"
              size?: "large" | "medium" | "small"
              text?: "signin_with" | "signup_with" | "continue_with" | "signin"
              shape?: "rectangular" | "pill" | "circle" | "square"
              logo_alignment?: "left" | "center"
              width?: number | string
              locale?: string
            },
          ) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

/** Decode a JWT payload safely.
 *  Fix 7: استبدال decodeURIComponent(escape()) المهجور في Node ≥22
 *  بـ TextDecoder الذي يدعم Unicode/UTF-8 بالكامل
 */
function decodeJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    const [, payload] = token.split(".")
    if (!payload) return null
    // base64url → base64 → Uint8Array → UTF-8 string
    const b64     = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded  = b64 + "=".repeat((4 - (b64.length % 4)) % 4)
    const binary  = atob(padded)
    const bytes   = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const json    = new TextDecoder("utf-8").decode(bytes)
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

interface AccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountDialog({ open, onOpenChange }: AccountDialogProps) {
  const { account, signIn, signOut } = useAccount()
  const buttonContainerRef = React.useRef<HTMLDivElement>(null)
  const [gsiReady, setGsiReady] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState("")

  // Initialize Google Identity Services when the script is loaded.
  React.useEffect(() => {
    if (!open || account || !gsiReady || !GOOGLE_CLIENT_ID) return
    const node = buttonContainerRef.current
    const gsi = window.google?.accounts?.id
    if (!node || !gsi) return

    gsi.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        const payload = decodeJwt<{
          sub: string
          email: string
          name?: string
          picture?: string
        }>(response.credential)
        if (!payload?.email) return
        signIn({
          id: payload.sub,
          name: payload.name ?? payload.email.split("@")[0]!,
          email: payload.email,
          picture: payload.picture,
          provider: "google",
        })
        onOpenChange(false)
      },
      auto_select: false,
    })

    node.innerHTML = ""
    gsi.renderButton(node, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: 320,
      locale: "ar",
    })
  }, [open, account, gsiReady, signIn, onOpenChange])

  const handleLocalSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName) {
      setError("من فضلك أدخل اسمك")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("بريد إلكتروني غير صالح")
      return
    }
    signIn({
      name: trimmedName,
      email: trimmedEmail,
      provider: "local",
    })
    setName("")
    setEmail("")
    onOpenChange(false)
  }

  return (
    <>
      {GOOGLE_CLIENT_ID && !account && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => setGsiReady(true)}
        />
      )}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          {account ? (
            <SignedInView account={account} onSignOut={() => signOut()} onClose={() => onOpenChange(false)} />
          ) : (
            <>
              <DialogHeader>
                <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  حسابك في ZIbot
                </div>
                <DialogTitle className="text-2xl">سجّل دخولك للاستمتاع بكل المميزات</DialogTitle>
                <DialogDescription>
                  حسابك مرتبط بمتصفحك ويظل محفوظاً بشكل آمن على جهازك. سجّل الدخول مع Google أو ببريدك الإلكتروني.
                </DialogDescription>
              </DialogHeader>

              {/* Google sign-in */}
              <div className="mt-2 flex flex-col items-center gap-2">
                {GOOGLE_CLIENT_ID ? (
                  <div ref={buttonContainerRef} className="flex min-h-[44px] w-full justify-center" />
                ) : (
                  <div className="w-full rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3 text-center text-xs text-muted-foreground">
                    تسجيل الدخول عبر Google متاح عند ضبط <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[11px]">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>
                  </div>
                )}
              </div>

              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-xs text-muted-foreground">أو</span>
                </div>
              </div>

              {/* Local sign-in */}
              <form className="flex flex-col gap-3" onSubmit={handleLocalSignIn}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="acc-name" className="text-xs font-semibold">
                    الاسم
                  </Label>
                  <Input
                    id="acc-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اسمك الكامل"
                    autoComplete="name"
                    dir="rtl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="acc-email" className="text-xs font-semibold">
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="acc-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    dir="ltr"
                  />
                </div>
                {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
                <Button type="submit" className="h-11 font-bold">
                  <Mail className="h-4 w-4" />
                  متابعة بالبريد الإلكتروني
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function SignedInView({
  account,
  onSignOut,
  onClose,
}: {
  account: Account
  onSignOut: () => void
  onClose: () => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">حسابك</DialogTitle>
        <DialogDescription>أنت مسجّل الدخول حالياً. يمكنك تسجيل الخروج في أي وقت.</DialogDescription>
      </DialogHeader>
      <div className="mt-2 flex items-center gap-4 rounded-2xl border border-border bg-secondary/50 p-4">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground",
          )}
        >
          {account.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={account.picture}
              alt={account.name}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <UserRound className="h-7 w-7" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-extrabold text-foreground">{account.name}</div>
          <div className="truncate text-sm text-muted-foreground" dir="ltr">
            {account.email}
          </div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {account.provider === "google" ? "Google" : "محلي"}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-11 font-bold" onClick={onClose}>
          إغلاق
        </Button>
        <Button
          variant="destructive"
          className="h-11 font-bold"
          onClick={() => {
            onSignOut()
            onClose()
          }}
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </>
  )
}
