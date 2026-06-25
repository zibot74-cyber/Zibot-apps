"use client"

import { ArrowLeft, ShieldCheck, Zap, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FreeTrialDialog } from "./free-trial-dialog"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

export function Hero() {
  const { t } = useTranslation()
  const s = t.hero

  return (
    <section id="home" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.35]" aria-hidden="true" />
      <div
        className="absolute right-1/2 top-0 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute end-full top-1/3 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-accent/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" aria-hidden />

      <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pt-28">
        <a
          href="#pricing"
          className="group inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10 sm:text-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span>{s.badge}</span>
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        </a>

        <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.08] tracking-tight text-foreground text-balance sm:text-5xl lg:text-[3.8rem]">
          {s.titlePart1}{" "}
          <span className="relative inline-block whitespace-nowrap">
            <span className="relative z-10 text-primary">{s.titleHighlight}</span>
            <span className="absolute -bottom-1 right-0 h-3 w-full -rotate-[1deg] bg-accent/40" aria-hidden />
          </span>
          <br />
          {s.titlePart2}
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {s.description}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <FreeTrialDialog
            trigger={
              <Button
                size="lg"
                className="h-12 w-full px-8 text-base font-bold shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
              >
                {s.startTrial}
                <ArrowLeft className="h-4 w-4" />
              </Button>
            }
          />
          <Button asChild size="lg" variant="outline" className="h-12 w-full px-8 text-base font-bold sm:w-auto">
            <a href="#pricing">{s.subscribe}</a>
          </Button>
        </div>

        <dl className="mx-auto mt-12 grid max-w-sm grid-cols-3 gap-4 border-t border-border pt-8">
          <Stat icon={Zap}         label={s.stats.avgResponse.label} value={s.stats.avgResponse.value} />
          <Stat icon={ShieldCheck} label={s.stats.accuracy.label}    value={s.stats.accuracy.value} />
          <Stat icon={Clock}       label={s.stats.uptime.label}       value={s.stats.uptime.value} />
        </dl>
      </div>
    </section>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="leading-tight">
        <dd className="font-display text-xl font-extrabold text-foreground">{value}</dd>
        <dt className="text-xs text-muted-foreground">{label}</dt>
      </div>
    </div>
  )
}
