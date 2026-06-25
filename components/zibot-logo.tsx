import { cn } from "@/lib/utils"

interface ZIbotLogoProps {
  className?: string
  showWordmark?: boolean
  variant?: "default" | "light"
  size?: "sm" | "md" | "lg"
}

/**
 * ZIbot brandmark.
 * A stylized "Z" inside a rounded chat-bubble with an amber spark, representing
 * fast, smart AI responses. Pure SVG so it stays crisp at any size and works as a favicon.
 * Adapts to light/dark via currentColor & CSS tokens.
 */
export function ZIbotLogo({
  className,
  showWordmark = true,
  variant = "default",
  size = "md",
}: ZIbotLogoProps) {
  const textColor =
    variant === "light"
      ? "text-primary-foreground dark:text-foreground"
      : "text-foreground"
  const sizes = {
    sm: { box: "h-8 w-8", icon: "h-4 w-4", text: "text-base" },
    md: { box: "h-9 w-9", icon: "h-5 w-5", text: "text-xl" },
    lg: { box: "h-12 w-12", icon: "h-7 w-7", text: "text-2xl" },
  }[size]

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-primary shadow-sm",
          sizes.box,
        )}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={cn("text-primary-foreground", sizes.icon)}
          aria-hidden="true"
        >
          {/* Chat bubble */}
          <path
            d="M5 8a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H14l-5 4v-4H8a3 3 0 0 1-3-3V8Z"
            fill="currentColor"
            opacity="0.95"
          />
          {/* Stylized Z — uses var(--primary) so it stays readable in both themes */}
          <path
            d="M11.5 10.5h9L12 18.5h9"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Amber spark */}
          <circle cx="24" cy="9" r="2.5" fill="var(--accent)" />
        </svg>
        <span className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-background" />
      </div>
      {showWordmark && (
        <span
          className={cn(
            "font-display font-extrabold tracking-tight",
            textColor,
            sizes.text,
          )}
        >
          ZIbot
        </span>
      )}
    </div>
  )
}
