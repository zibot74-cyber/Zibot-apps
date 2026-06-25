"use client"

import { Check, Crown, Sparkles, Gift, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FreeTrialDialog } from "./free-trial-dialog"
import { PaymentDialog } from "./payment-dialog"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

export function Pricing() {
  const { t } = useTranslation()
  const p = t.pricing

  return (
    <section id="pricing" className="relative overflow-hidden py-20 sm:py-28">
      <div
        className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {p.badge}
          </div>
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground text-balance sm:text-4xl lg:text-5xl">
            {p.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-pretty">
            {p.subtitle}
          </p>
        </div>

        {/* Free trial spotlight card */}
        <div className="mx-auto mt-12 max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-accent/60 bg-card p-7 shadow-sm sm:p-8">
            <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" aria-hidden />
            <div className="relative grid items-center gap-6 sm:grid-cols-5">
              <div className="sm:col-span-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-accent-foreground dark:bg-accent/15 dark:text-accent">
                  <Gift className="h-3.5 w-3.5" />
                  {p.freeTrial.badge}
                </div>
                <h3 className="mt-3 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
                  {p.freeTrial.title}
                </h3>
                <p className="mt-2 max-w-lg leading-relaxed text-muted-foreground">
                  {p.freeTrial.description}
                </p>
              </div>
              <div className="sm:col-span-2 sm:text-left">
                <FreeTrialDialog
                  trigger={
                    <Button
                      size="lg"
                      className="h-12 w-full bg-accent px-6 text-base font-bold text-accent-foreground shadow-md shadow-accent/30 hover:bg-accent/90 sm:w-auto"
                    >
                      {p.freeTrial.button}
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  }
                />
                <p className="mt-2 text-xs text-muted-foreground">{p.freeTrial.note}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Standard plans */}
        <div className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-3">
          {p.plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl border bg-card p-7 transition-all ${
                plan.popular
                  ? "border-primary shadow-2xl shadow-primary/15 md:-translate-y-3 md:scale-[1.02]"
                  : "border-border hover:border-primary/40 hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 right-1/2 inline-flex translate-x-1/2 items-center gap-1.5 rounded-full bg-accent px-3.5 py-1 text-xs font-bold text-accent-foreground shadow-lg">
                  <Sparkles className="h-3.5 w-3.5" />
                  {p.popular}
                </div>
              )}

              <div>
                <h3 className="font-display text-2xl font-extrabold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-extrabold text-foreground">${plan.price}</span>
                <span className="text-muted-foreground">{p.perMonth}</span>
              </div>

              <div className={`mt-4 rounded-2xl p-4 ${plan.popular ? "bg-primary/10" : "bg-secondary"}`}>
                <div className="text-xs font-semibold text-muted-foreground">{p.durationLabel}</div>
                <div className="mt-0.5 font-display text-lg font-extrabold text-foreground">{plan.duration}</div>
                <div className="text-xs text-muted-foreground">{plan.durationNote}</div>
              </div>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              <PaymentDialog
                plan={{
                  name:         plan.name,
                  price:        plan.price,
                  duration:     plan.duration,
                  durationNote: plan.durationNote,
                }}
                trigger={
                  <Button
                    size="lg"
                    className="mt-7 h-12 w-full font-bold"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                }
              />
            </div>
          ))}
        </div>

        {/* VIP plans */}
        <div className="mx-auto mt-16 max-w-6xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-foreground dark:bg-accent/10 dark:text-accent">
              <Crown className="h-3.5 w-3.5" />
              {p.vip.badge}
            </div>
            <h3 className="mt-4 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
              {p.vip.title}
            </h3>
            <p className="mt-2 max-w-2xl text-muted-foreground">{p.vip.subtitle}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {p.vip.plans.map((plan, i) => (
              <div
                key={plan.name}
                className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-foreground p-8 text-background"
              >
                <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-accent">
                      <Crown className="h-3.5 w-3.5" />
                      {plan.name}
                    </div>
                    {i === 1 && (
                      <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                        {p.vip.bestValue}
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-display text-5xl font-extrabold text-accent">${plan.price}</span>
                    <span className="text-background/70">{p.vip.once}</span>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-background/15 bg-background/5 px-4 py-2.5">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="font-display font-bold">{plan.duration}</span>
                    <span className="text-sm text-background/70">{p.vip.continuousService}</span>
                  </div>

                  <p className="mt-5 leading-relaxed text-background/80">{plan.description}</p>

                  <PaymentDialog
                    plan={{
                      name:     plan.name,
                      price:    plan.price,
                      duration: plan.duration,
                    }}
                    trigger={
                      <Button
                        size="lg"
                        className="mt-6 h-12 w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
                      >
                        {p.vip.subscribePrefix} {plan.name}
                      </Button>
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
          {p.footer}
        </p>
      </div>
    </section>
  )
}
