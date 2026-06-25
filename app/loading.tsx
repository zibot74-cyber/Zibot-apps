import { ZIbotLogo } from "@/components/zibot-logo"

export default function Loading() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background"
      aria-label="جارٍ التحميل"
      role="status"
    >
      <ZIbotLogo size="lg" showWordmark />
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-primary"
            style={{
              animation: `zibot-bounce 0.8s ease-in-out ${i * 0.16}s infinite alternate`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
