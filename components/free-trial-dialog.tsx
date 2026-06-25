"use client"

import { HelpCircle, MessageCircle, ShieldCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { WhatsappStepsDialog } from "./whatsapp-steps-dialog"
import { TrialBarcode } from "./trial-barcode"
import { WHATSAPP_LINK_TRIAL } from "@/lib/constants"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

interface FreeTrialDialogProps {
  trigger: React.ReactNode
}

export function FreeTrialDialog({ trigger }: FreeTrialDialogProps) {
  const { t } = useTranslation()
  const ft = t.freeTrial

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            {ft.badge}
          </div>
          <DialogTitle className="text-2xl">{ft.title}</DialogTitle>
          <DialogDescription>{ft.description}</DialogDescription>
        </DialogHeader>

        <TrialBarcode />

        <WhatsappStepsDialog
          trigger={
            <button
              type="button"
              className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 px-4 py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary hover:text-primary"
            >
              <HelpCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
              {ft.howToScan}
            </button>
          }
        />

        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <a href={WHATSAPP_LINK_TRIAL} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            {ft.directContact}
          </a>
        </Button>
      </DialogContent>
    </Dialog>
  )
}
