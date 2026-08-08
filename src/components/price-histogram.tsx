import { BarSeries, type BarSeriesDatum } from "@/components/bar-series"
import {
  formatCurrency,
  formatDecimal,
  formatPercent,
} from "@/lib/analytics/format"
import type { PriceDistribution } from "@/lib/shop-types"

export interface PriceHistogramProps {
  distribution: PriceDistribution
}

export function PriceHistogram({ distribution }: PriceHistogramProps) {
  const currency = distribution.currencyCode

  const data: BarSeriesDatum[] = distribution.buckets.map((bucket) => ({
    key: String(bucket.from),
    label: formatCurrency(bucket.from, currency),
    value: bucket.count,
    title: [
      `${formatCurrency(bucket.from, currency)}–${formatCurrency(bucket.to, currency)}`,
      `${bucket.count} listings (${formatPercent(bucket.share, 0)})`,
      `${formatDecimal(bucket.averageViewsPerDay, 1)} views/day on average`,
      `${formatPercent(bucket.averageFavoriteRate, 1)} favorite rate`,
    ].join(" · "),
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-body">
        <span className="text-muted-foreground">
          Median{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatCurrency(distribution.median, currency)}
          </span>
        </span>
        <span className="text-muted-foreground">
          Middle 50%{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatCurrency(distribution.p25, currency)}–
            {formatCurrency(distribution.p75, currency)}
          </span>
        </span>
        <span className="text-muted-foreground">
          Range{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatCurrency(distribution.min, currency)}–
            {formatCurrency(distribution.max, currency)}
          </span>
        </span>
      </div>

      <BarSeries
        data={data}
        caption="Number of listings in each price band"
        categoryLabel="Price band"
        valueLabel="Listings"
        emptyMessage="No priced listings captured yet."
      />

      <p className="text-caption text-muted-foreground">
        Hover a bar for the average views per day and favorite rate in that band —
        that is where you see which price points actually get traction.
      </p>
    </div>
  )
}
