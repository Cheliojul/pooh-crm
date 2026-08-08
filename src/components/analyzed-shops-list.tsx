import Link from "next/link"
import { Store, TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  formatAgo,
  formatCompact,
  formatDecimal,
  formatNumber,
} from "@/lib/analytics/format"
import type { ShopIndexEntry } from "@/lib/shop-types"

export interface AnalyzedShopsListProps {
  shops: ShopIndexEntry[]
  /**
   * Reference point for "last analyzed 3d ago". Passed in rather than read from
   * `Date.now()` here, which would be an impure render.
   */
  now: number
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-body font-medium tabular-nums">{value}</span>
    </div>
  )
}

export function AnalyzedShopsList({ shops, now }: AnalyzedShopsListProps) {
  if (shops.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
        <Store className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-body font-medium">No shops analyzed yet</p>
        <p className="max-w-md text-caption text-muted-foreground">
          Paste an Etsy shop URL above. Each analysis is stored locally, and
          re-analyzing the same shop later is what turns those snapshots into a real
          sales-per-day figure.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {shops.map((shop) => (
        <Card key={shop.shopId}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <Link
                href={`/shop-analyzer/${shop.shopId}`}
                className="truncate hover:underline"
              >
                {shop.shopName}
              </Link>
              <div className="flex shrink-0 gap-1">
                {shop.isVacation ? <Badge variant="outline">On vacation</Badge> : null}
                {shop.lastCapturePartial ? (
                  <Badge
                    variant="outline"
                    className="bg-status-confirmed text-status-confirmed-foreground"
                    title="The most recent capture did not fetch every listing"
                  >
                    <TriangleAlert aria-hidden="true" />
                    Partial
                  </Badge>
                ) : null}
              </div>
            </CardTitle>
            {shop.title ? (
              <p className="truncate text-caption text-muted-foreground">{shop.title}</p>
            ) : null}
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Sales / day" value={formatDecimal(shop.recentSalesPerDay, 1)} />
              <Metric label="Lifetime sales" value={formatCompact(shop.lifetimeSales)} />
              <Metric
                label="Listings"
                value={formatNumber(shop.activeListingCount)}
              />
              <Metric label="Favorites" value={formatCompact(shop.numFavorers)} />
              <Metric
                label="Rating"
                value={
                  shop.reviewAverage === null
                    ? "—"
                    : `${formatDecimal(shop.reviewAverage, 1)}★`
                }
              />
              <Metric label="Snapshots" value={formatNumber(shop.snapshotCount)} />
            </div>

            <p className="text-caption text-muted-foreground">
              {shop.snapshotCount < 2
                ? "Re-analyze in a few days to measure sales velocity"
                : `Last analyzed ${formatAgo(shop.lastAnalyzedAt, now)}`}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
