import { BarSeries, type BarSeriesDatum } from "@/components/bar-series"
import { formatNumber } from "@/lib/analytics/format"
import type { ListingsTimeline } from "@/lib/shop-types"

export interface ListingsTimelineChartProps {
  timeline: ListingsTimeline
}

/**
 * When a shop published its catalogue. The clearest read on whether a competitor
 * is still actively building or coasting on old inventory.
 */
export function ListingsTimelineChart({ timeline }: ListingsTimelineChartProps) {
  const data: BarSeriesDatum[] = timeline.buckets.map((bucket) => ({
    key: bucket.month,
    label: bucket.label,
    value: bucket.count,
    title: `${bucket.label}: ${bucket.count} new listings · ${formatNumber(
      bucket.cumulative
    )} total by then`,
  }))

  const recent = timeline.buckets.slice(-3)
  const recentTotal = recent.reduce((total, bucket) => total + bucket.count, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-body">
        <span className="text-muted-foreground">
          Busiest month{" "}
          <span className="font-medium text-foreground">
            {timeline.busiestMonth
              ? `${timeline.busiestMonth.label} (${timeline.busiestMonth.count})`
              : "—"}
          </span>
        </span>
        <span className="text-muted-foreground">
          Last 3 months{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatNumber(recentTotal)} new listings
          </span>
        </span>
      </div>

      <BarSeries
        data={data}
        caption="Listings published per month"
        categoryLabel="Month"
        valueLabel="New listings"
        emptyMessage="No listings captured yet."
      />

      <p className="text-caption text-muted-foreground">
        Based on each listing&apos;s original creation date. Months before the last
        three years are folded into the totals rather than drawn.
      </p>
    </div>
  )
}
