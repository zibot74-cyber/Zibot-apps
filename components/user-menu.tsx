"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { MoreVertical, Sun, Moon, Settings, UserRound, LogOut, LogIn } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAccount } from "@/hooks/use-account"
import { AccountDialog } from "./account-dialog"
import { SettingsDialog } from "./settings-dialog"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

interface UserMenuProps {
  className?: string
}

export function UserMenu({ className }: UserMenuProps) {
  const { account, signOut, hydrated } = useAccount()
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useTranslation()
  const [accountOpen, setAccountOpen] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t.userMenu.openMenu}
            className={cn(
              "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              className,
            )}
          >
            {hydrated && account ? (
              account.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={account.picture}
                  alt={account.name}
                  className="h-7 w-7 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary font-display text-sm font-extrabold text-primary-foreground">
                  {account.name.charAt(0).toUpperCase()}
                </span>
              )
            ) : (
              <MoreVertical className="h-5 w-5" aria-hidden />
            )}
            <span className="sr-only">{t.userMenu.openMenuSr}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-56">
          {hydrated && account ? (
            <>
              <DropdownMenuLabel className="flex items-center gap-3 py-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground">
                  {account.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={account.picture} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserRound className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground">{account.name}</span>
                  <span className="block truncate text-[11px] font-normal text-muted-foreground" dir="ltr">
                    {account.email}
                  </span>
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          ) : null}

          <DropdownMenuItem onSelect={() => setTheme(isDark ? "light" : "dark")}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? t.userMenu.themeLight : t.userMenu.themeDark}
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
            {t.userMenu.settingsLabel}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {hydrated && account ? (
            <DropdownMenuItem onSelect={() => setAccountOpen(true)}>
              <UserRound className="h-4 w-4" />
              {t.userMenu.viewAccount}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setAccountOpen(true)}>
              <LogIn className="h-4 w-4" />
              {t.userMenu.signIn}
            </DropdownMenuItem>
          )}

          {hydrated && account && (
            <DropdownMenuItem
              onSelect={() => signOut()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {t.userMenu.signOut}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountDialog open={accountOpen} onOpenChange={setAccountOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
