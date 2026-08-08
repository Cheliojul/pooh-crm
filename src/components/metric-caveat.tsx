import { cn } from "@/lib/utils"

export interface MetricCaveatProps {
  /** What the reader needs to know about how this number was derived. */
  explanation: string
  marker?: string
  className?: string
}

/**
 * Marks a derived number whose assumption the reader has to know about — Etsy
 * exposes no per-order revenue, so anything money-shaped here is an estimate.
 * Inline and hoverable rather than a footnote, which nobody reads.
 */
export function MetricCaveat({
  explanation,
  marker = "est",
  className,
}: MetricCaveatProps) {
  return (
    <sup
      title={explanation}
      aria-label={explanation}
      className={cn(
        "ml-0.5 cursor-help text-[0.625rem] font-medium text-muted-foreground underline decoration-dotted underline-offset-2",
        className
      )}
    >
      {marker}
    </sup>
  )
}
