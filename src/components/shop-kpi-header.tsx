import { StatCard } from "@/components/stat-card"
import {
  formatCompact,
  formatCurrency,
  formatDecimal,
  formatDuration,
  formatNumber,
  formatPercent,
} from "@/lib/analytics/format"
import type { ShopAnalysis } from "@/lib/shop-types"

const REVENUE_CAVEAT =
  "Estimated: Etsy exposes no per-order revenue. This is lifetime sales multiplied by the average listing price, so it is unreliable for shops with a wide price spread."

const CONVERSION_CAVEAT =
  "Directional only: lifetime sales divided by current view counters, which cover different periods."

const VELOCITY_CAVEAT =
  "Measured from the change in lifetime sales between two of your captures — the only exact sales signal Etsy exposes."

export interface ShopKpiHeaderProps {
  analysis: ShopAnalysis
}

export function ShopKpiHeader({ analysis }: ShopKpiHeaderProps) {
  const { kpis, velocity } = analysis
  const currency = kpis.currencyCode

  // Recent velocity against the lifetime average is the most useful single read
  // on the page: it says whether a shop is speeding up or coasting.
  const trend =
    kpis.recentSalesPerDay !== null && kpis.lifetimeSalesPerDay
      ? kpis.recentSalesPerDay / kpis.lifetimeSalesPerDay - 1
      : null

  const velocityHint =
    velocity.status === "insufficient-snapshots"
      ? "Re-analyze in a few days to measure this"
      : velocity.status === "gap-too-short"
        ? "Captures are too close together to measure"
        : velocity.status === "anomaly"
          ? "Lifetime sales went down — data anomaly"
          : velocity.windowDays !== null
            ? `Over the last ${formatDecimal(velocity.windowDays, 0)} days`
            : undefined

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      <StatCard
        label="Sales / day"
        value={formatDecimal(kpis.recentSalesPerDay, 1)}
        hint={velocityHint}
        delta={
          trend !== null
            ? `${trend >= 0 ? "▲" : "▼"} ${formatPercent(Math.abs(trend), 0)} vs lifetime average`
            : undefined
        }
        deltaTone={trend === null ? "neutral" : trend >= 0 ? "positive" : "negative"}
        caveat={velocity.status === "ok" ? VELOCITY_CAVEAT : undefined}
      />
      <StatCard
        label="Lifetime sales"
        value={formatNumber(kpis.lifetimeSales)}
        hint={`${formatDecimal(kpis.lifetimeSalesPerDay, 1)} / day since opening`}
      />
      <StatCard
        label="Next 30 days"
        value={formatNumber(
          kpis.projectedSales30d === null ? null : Math.round(kpis.projectedSales30d)
        )}
        hint="Projected sales at the current rate"
        caveat={
          kpis.projectedSales30d === null
            ? undefined
            : "Straight-line projection from recent velocity. It assumes nothing changes — no seasonality, no new listings."
        }
      />
      <StatCard
        label="Est. lifetime revenue"
        value={formatCurrency(kpis.estimatedLifetimeRevenue, currency)}
        hint={
          kpis.estimatedRevenuePerDay !== null
            ? `${formatCurrency(kpis.estimatedRevenuePerDay, currency)} / day`
            : undefined
        }
        caveat={REVENUE_CAVEAT}
      />

      <StatCard
        label="Active listings"
        value={formatNumber(kpis.activeListingCount)}
        hint={
          kpis.digitalShare !== null && kpis.digitalShare > 0
            ? `${formatPercent(kpis.digitalShare, 0)} digital`
            : undefined
        }
      />
      <StatCard
        label="Avg listing price"
        value={formatCurrency(kpis.averagePrice, currency)}
        hint={`Median ${formatCurrency(kpis.medianPrice, currency)}`}
      />
      <StatCard
        label="Total listing views"
        value={formatCompact(kpis.totalListingViews)}
        hint={`${formatCompact(kpis.totalListingFavorers)} listing favorites`}
      />
      <StatCard
        label="Sales per view"
        value={formatPercent(kpis.conversionProxy, 2)}
        hint="Across the whole shop"
        caveat={CONVERSION_CAVEAT}
      />

      <StatCard
        label="Shop favorites"
        value={formatCompact(kpis.shopFavorers)}
        hint={
          velocity.recentFavorersPerDay !== null
            ? `${formatDecimal(velocity.recentFavorersPerDay, 1)} / day`
            : undefined
        }
      />
      <StatCard
        label="Reviews"
        value={formatNumber(kpis.reviewCount)}
        hint={
          kpis.reviewAverage !== null
            ? `${formatDecimal(kpis.reviewAverage, 1)} average rating`
            : undefined
        }
      />
      <StatCard
        label="Shop age"
        value={formatDuration(kpis.shopAgeDays)}
        hint={
          kpis.reviewsPerSale !== null
            ? `${formatPercent(kpis.reviewsPerSale, 0)} of sales reviewed`
            : undefined
        }
      />
      <StatCard
        label="New listings"
        value={formatNumber(kpis.listingsAdded30d)}
        hint={`${formatNumber(kpis.listingsAdded90d)} in the last 90 days`}
      />
    </div>
  )
}
