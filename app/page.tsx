import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { PricingSection } from "@/components/pricing-section"
import { FAQ } from "@/components/faq"
import { CTA } from "@/components/cta"
import { SiteFooter } from "@/components/site-footer"
import { WhatsappFloat } from "@/components/whatsapp-float"

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <PricingSection />
        <FAQ />
        <CTA />
      </main>
      <SiteFooter />
      <WhatsappFloat />
    </>
  )
}
