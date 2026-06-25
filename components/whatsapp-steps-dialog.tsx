"use client"

import Image from "next/image"
import { useState } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

const STEP_IMAGES = [
  "/whatsapp-steps/step-1.png",
  "/whatsapp-steps/step-2.png",
  "/whatsapp-steps/step-3.png",
  "/whatsapp-steps/step-4.png",
]

interface WhatsappStepsDialogProps {
  trigger: React.ReactNode
}

export function WhatsappStepsDialog({ trigger }: WhatsappStepsDialogProps) {
  const [index, setIndex] = useState(0)
  const { t } = useTranslation()
  const ws = t.whatsappSteps

  const step = ws.steps[index]
  const isFirst = index === 0
  const isLast = index === ws.steps.length - 1

  const stepBadge = ws.stepBadge.replace("{n}", String(index + 1))
  const stepOf = ws.stepOf
    .replace("{current}", String(index + 1))
    .replace("{total}", String(ws.steps.length))

  return (
    <Dialog onOpenChange={() => setIndex(0)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl p-0 sm:p-0">
        <div className="grid gap-0 sm:grid-cols-5">
          {/* Image side */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-t-3xl bg-secondary sm:col-span-2 sm:aspect-auto sm:rounded-r-3xl sm:rounded-tl-none">
            <Image
              src={STEP_IMAGES[index] ?? "/placeholder.svg"}
              alt={step.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 40vw"
            />
            <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-foreground/90 px-3 py-1 text-xs font-bold text-background backdrop-blur-sm">
              {stepOf}
            </div>
          </div>

          {/* Content side */}
          <div className="flex flex-col p-6 sm:col-span-3 sm:p-8">
            <DialogHeader>
              <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {stepBadge}
              </div>
              <DialogTitle className="text-2xl">{step.title}</DialogTitle>
              <DialogDescription className="mt-2 text-base">{step.description}</DialogDescription>
            </DialogHeader>

            {/* Progress dots */}
            <div className="mt-6 flex items-center gap-1.5" role="tablist" aria-label={ws.stepsLabel}>
              {ws.steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`${ws.stepLabel} ${i + 1}`}
                  role="tab" aria-selected={i === index}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-8 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>

            <div className="mt-auto flex items-center justify-between gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={isFirst}
              >
                <ChevronRight className="h-4 w-4" />
                {ws.prev}
              </Button>
              <Button
                size="sm"
                onClick={() => setIndex((i) => Math.min(ws.steps.length - 1, i + 1))}
                disabled={isLast}
              >
                {ws.next}
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
