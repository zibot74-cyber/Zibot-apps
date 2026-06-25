"use client"

import * as React from "react"
import QRCode from "qrcode"
import JsBarcode from "jsbarcode"
import { Download, RefreshCw, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { WHATSAPP_NUMBER } from "@/lib/constants"

/**
 * Generates a real, deterministic trial code:
 * Format: ZIBOT-TRIAL-XXXXXX (alphanumeric uppercase, CODE128-safe).
 */
function generateTrialCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // No ambiguous chars (I,O,0,1)
  let suffix = ""
  const bytes = new Uint8Array(6)
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  for (let i = 0; i < bytes.length; i++) {
    suffix += chars[bytes[i]! % chars.length]
  }
  return `ZIBOT-TRIAL-${suffix}`
}

/** Build a real WhatsApp deep-link that carries the trial code. */
function buildWhatsAppLink(code: string) {
  const cleanNumber = WHATSAPP_NUMBER.replace(/[^0-9]/g, "")
  const message = `أهلاً، أريد تفعيل التجربة المجانية في ZIbot. كود التجربة: ${code}`
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function TrialBarcode() {
  const [code, setCode] = React.useState<string>("")
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("")
  const [copied, setCopied] = React.useState(false)
  const barcodeRef = React.useRef<SVGSVGElement>(null)

  const regenerate = React.useCallback(() => {
    const next = generateTrialCode()
    setCode(next)
  }, [])

  // Initial code on mount (client-only to keep crypto random safe).
  React.useEffect(() => {
    regenerate()
  }, [regenerate])

  // Render the QR (encoding the WhatsApp link).
  React.useEffect(() => {
    if (!code) return
    let cancelled = false
    const link = buildWhatsAppLink(code)
    QRCode.toDataURL(link, {
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 8,
      color: { dark: "#0e2520", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("")
      })
    return () => {
      cancelled = true
    }
  }, [code])

  // Render the CODE128 barcode for the trial code.
  React.useEffect(() => {
    if (!code || !barcodeRef.current) return
    try {
      JsBarcode(barcodeRef.current, code, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        height: 56,
        width: 1.6,
        background: "transparent",
        lineColor: "currentColor",
      })
    } catch {
      // Silently ignore; UI shows the readable code below.
    }
  }, [code])

  const handleCopy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const handleDownloadQr = () => {
    if (!qrDataUrl) return
    downloadDataUrl(qrDataUrl, `zibot-trial-${code}.png`)
  }

  const handleDownloadBarcode = () => {
    if (!barcodeRef.current) return
    const svgString = new XMLSerializer().serializeToString(barcodeRef.current)
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    downloadDataUrl(url, `zibot-trial-${code}.svg`)
    // Cleanup
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* QR code card */}
      <div className="mx-auto w-full max-w-[260px]">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-white p-3 shadow-md">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`باركود تفعيل التجربة المجانية ${code}`}
              className="h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              جاري توليد الباركود…
            </div>
          )}
          {/* Corner brackets */}
          <span className="pointer-events-none absolute right-2 top-2 h-5 w-5 border-r-2 border-t-2 border-primary" />
          <span className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l-2 border-t-2 border-primary" />
          <span className="pointer-events-none absolute right-2 bottom-2 h-5 w-5 border-b-2 border-r-2 border-primary" />
          <span className="pointer-events-none absolute left-2 bottom-2 h-5 w-5 border-b-2 border-l-2 border-primary" />
        </div>
      </div>

      {/* CODE128 barcode */}
      <div className="rounded-2xl border border-border bg-card p-3">
        <div className="flex h-16 w-full items-center justify-center text-foreground">
          <svg ref={barcodeRef} className="h-full w-full" aria-label={`باركود ${code}`} />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm font-bold tracking-wider text-foreground transition-colors hover:border-primary/40 hover:text-primary",
          )}
          dir="ltr"
          aria-label="نسخ كود التجربة"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{code || "—"}</span>
        </button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 font-bold"
          onClick={handleDownloadQr}
          disabled={!qrDataUrl}
        >
          <Download className="h-4 w-4" />
          تحميل QR
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 font-bold"
          onClick={handleDownloadBarcode}
          disabled={!code}
        >
          <Download className="h-4 w-4" />
          تحميل الباركود
        </Button>
      </div>

      <button
        type="button"
        onClick={regenerate}
        className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        توليد كود جديد
      </button>
    </div>
  )
}
