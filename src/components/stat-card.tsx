import { MetricCaveat } from "@/components/metric-caveat"
import { cn } from "@/lib/utils"

export type StatTone = "positive" | "negative" | "neutral"

const TONE_STYLES: Record<StatTone, string> = {
  positive: "text-status-delivered-foreground",
  negative: "text-status-cancelled-foreground",
  neutral: "text-muted-foreground",
}

export interface StatCardProps {
  label: string
  value: string
  /** Secondary line under the value — context, not another metric. */
  hint?: string
  delta?: string
  deltaTone?: StatTone
  /** When set, renders a caveat marker explaining how the value was derived. */
  caveat?: string
}

export function StatCard({
  label,
  value,
  hint,
  delta,
  deltaTone = "neutral",
  caveat,
}: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-4">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="font-heading text-page-title font-semibold tabular-nums">
        {value}
        {caveat ? <MetricCaveat explanation={caveat} /> : null}
      </span>
      {delta ? (
        <span className={cn("text-caption font-medium tabular-nums", TONE_STYLES[deltaTone])}>
          {delta}
        </span>
      ) : null}
      {hint ? <span className="text-caption text-muted-foreground">{hint}</span> : null}
    </div>
  )
}
