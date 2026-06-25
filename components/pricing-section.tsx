"use client"

import dynamic from "next/dynamic"

const Pricing = dynamic(
  () => import("./pricing").then(m => m.Pricing),
  { ssr: false, loading: () => <div style={{ minHeight: 400 }} /> }
)

export function PricingSection() {
  return <Pricing />
}
