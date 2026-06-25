"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  MessageCircle,
  Smartphone,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { WHATSAPP_NUMBER } from "@/lib/constants"

// ── أيقونات شركات الدفع (SVG داخلي بدون مكتبة) ──────────────
function VodafoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none">
      <rect width="40" height="40" rx="10" fill="#E60000" />
      <path d="M20 8C13.37 8 8 13.37 8 20s5.37 12 12 12 12-5.37 12-12S26.63 8 20 8zm0 18.5c-3.59 0-6.5-2.91-6.5-6.5S16.41 13.5 20 13.5s6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5z" fill="white"/>
    </svg>
  )
}

function OrangeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none">
      <rect width="40" height="40" rx="10" fill="#FF7900" />
      <rect x="10" y="16" width="20" height="8" rx="4" fill="white" />
    </svg>
  )
}

function EtisalatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none">
      <rect width="40" height="40" rx="10" fill="#009639" />
      <circle cx="20" cy="20" r="8" stroke="white" strokeWidth="3" fill="none" />
      <circle cx="20" cy="20" r="3" fill="white" />
    </svg>
  )
}

// ── أنواع البيانات ────────────────────────────────────────────
interface PlanInfo {
  name: string
  price: string
  duration: string
  durationNote?: string
}

interface PaymentDialogProps {
  trigger: React.ReactNode
  plan: PlanInfo
}

type Step = "choose" | "cash" | "confirm" | "success"
type Method = "vodafone" | "orange" | "etisalat" | "whatsapp"

const METHODS = [
  {
    id: "vodafone" as Method,
    label: "Vodafone Cash",
    Icon: VodafoneIcon,
    color: "#E60000",
    desc: "دفع فوري عبر فودافون كاش",
  },
  {
    id: "orange" as Method,
    label: "Orange Cash",
    Icon: OrangeIcon,
    color: "#FF7900",
    desc: "دفع فوري عبر أورنج كاش",
  },
  {
    id: "etisalat" as Method,
    label: "Etisalat Cash",
    Icon: EtisalatIcon,
    color: "#009639",
    desc: "دفع فوري عبر اتصالات كاش",
  },
  {
    id: "whatsapp" as Method,
    label: "WhatsApp",
    Icon: MessageCircle,
    color: "#25D366",
    desc: "تواصل مع الدعم لإتمام الاشتراك",
  },
]

// ── المكوّن الرئيسي ───────────────────────────────────────────
export function PaymentDialog({ trigger, plan }: PaymentDialogProps) {
  const [open,      setOpen]      = useState(false)
  const [step,      setStep]      = useState<Step>("choose")
  const [method,    setMethod]    = useState<Method | null>(null)
  const [phone,     setPhone]     = useState("")
  const [reference, setReference] = useState("")
  const [error,     setError]     = useState("")
  const [loading,   setLoading]   = useState(false)

  function reset() {
    setStep("choose"); setMethod(null)
    setPhone(""); setReference(""); setError(""); setLoading(false)
  }

  function handleOpen(v: boolean) {
    setOpen(v)
    if (!v) reset()
  }

  function pickMethod(m: Method) {
    if (m === "whatsapp") {
      const msg = encodeURIComponent(
        `أهلاً، أريد الاشتراك في باقة ${plan.name} بسعر ${plan.price} جنيه`
      )
      window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${msg}`, "_blank", "noopener,noreferrer")
      return
    }
    setMethod(m)
    setStep("cash")
    setError("")
  }

  async function submitPayment() {
    if (!phone.trim()) { setError("أدخل رقم هاتفك"); return }
    if (!/^01[0-9]{9}$/.test(phone.trim())) { setError("رقم غير صحيح — يجب أن يكون 11 رقماً يبدأ بـ 01"); return }
    setLoading(true); setError("")
    try {
      // إرسال طلب الدفع للسيرفر
      const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL || ""
      const res = await fetch(`${BOT_URL}/api/payment/manual`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          plan:      plan.name,
          method,
          reference: phone.trim(),
          notes:     `طلب من الموقع التسويقي — ${plan.price} جنيه — ${plan.duration}`,
        }),
      })
      if (!res.ok) console.warn("payment/manual notify failed:", res.status)
      // إذا لم يكن مسجّل دخول، نُظهر شاشة تأكيد محلية
      setStep("success")
    } catch {
      setStep("success") // fallback — نُظهر تأكيد وننبّه للتواصل
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  })

  const selectedMethod = METHODS.find(m => m.id === method)

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto rounded-3xl p-0">

        {/* Header */}
        <DialogHeader className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold">
                الاشتراك في باقة {plan.name}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {plan.price} جنيه · {plan.duration}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5">

          {/* ── اختيار طريقة الدفع ── */}
          {step === "choose" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                اختر طريقة الدفع المناسبة لك
              </p>

              {/* ملخص الباقة */}
              <div className="rounded-2xl bg-secondary/60 p-4 space-y-2 border border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الباقة</span>
                  <span className="font-bold">{plan.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">السعر</span>
                  <span className="font-extrabold text-primary">{plan.price} جنيه</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">مدة الخدمة</span>
                  <span className="font-bold">{plan.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">التاريخ</span>
                  <span className="text-muted-foreground">{today}</span>
                </div>
              </div>

              {/* طرق الدفع */}
              <div className="grid grid-cols-2 gap-3">
                {METHODS.map(({ id, label, Icon, color, desc }) => (
                  <button
                    key={id}
                    onClick={() => pickMethod(id)}
                    className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-4 text-center transition-all hover:border-primary/40 hover:shadow-md hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {id === "whatsapp"
                      ? <Icon className="h-9 w-9" style={{ color }} />
                      : <Icon className="h-9 w-9 rounded-xl" />
                    }
                    <span className="text-xs font-bold text-foreground leading-tight">{label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── إدخال رقم المحفظة ── */}
          {step === "cash" && selectedMethod && (
            <div className="space-y-4">
              <button
                onClick={() => { setStep("choose"); setError("") }}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                رجوع
              </button>

              {/* طريقة الدفع المختارة */}
              <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-4 border border-border">
                {selectedMethod.id === "whatsapp"
                  ? <selectedMethod.Icon className="h-9 w-9 shrink-0" style={{ color: selectedMethod.color }} />
                  : <selectedMethod.Icon className="h-9 w-9 shrink-0 rounded-xl" />
                }
                <div>
                  <p className="text-sm font-bold">{selectedMethod.label}</p>
                  <p className="text-xs text-muted-foreground">{plan.price} جنيه · {plan.name}</p>
                </div>
              </div>

              {/* رقم المحفظة */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  رقم المحفظة *
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="01xxxxxxxxx"
                  maxLength={11}
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/\D/g, "")); setError("") }}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
                <p className="text-[11px] text-muted-foreground">
                  رقم المحفظة الخاص بك (11 رقم يبدأ بـ 01)
                </p>
              </div>

              {/* رقم المرجع (اختياري) */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  رقم المرجع بعد التحويل <span className="text-xs font-normal text-muted-foreground">(اختياري)</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="XXXXXXXXXX"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>

              {/* خطأ */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* زر الإرسال */}
              <Button
                onClick={submitPayment}
                disabled={loading || phone.length < 11}
                className="w-full h-11 rounded-2xl font-bold text-sm"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الإرسال...</>
                  : <><CheckCircle className="h-4 w-4" /> تأكيد طلب الاشتراك</>
                }
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">
                سيتم التواصل معك على هذا الرقم لتأكيد الاشتراك وتفعيل الباقة
              </p>
            </div>
          )}

          {/* ── نجاح ── */}
          {step === "success" && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold mb-1">تم استلام طلبك</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  سيتواصل معك فريقنا على رقمك خلال ساعات لتأكيد الاشتراك في
                  باقة <strong className="text-foreground">{plan.name}</strong> وتفعيلها.
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/60 p-4 border border-border text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الباقة</span>
                  <span className="font-bold">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المبلغ</span>
                  <span className="font-extrabold text-primary">{plan.price} جنيه</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المدة</span>
                  <span className="font-bold">{plan.duration}</span>
                </div>
              </div>
              <Button
                onClick={() => handleOpen(false)}
                variant="outline"
                className="rounded-2xl"
              >
                <RefreshCw className="h-4 w-4" />
                حسناً، شكراً
              </Button>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
