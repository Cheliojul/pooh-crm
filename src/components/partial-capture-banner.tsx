import { TriangleAlert } from "lucide-react"

import { formatNumber } from "@/lib/analytics/format"

export interface PartialCaptureBannerProps {
  fetchedListingCount: number
  expectedListingCount: number
  errors: string[]
}

/**
 * Shown when listing pagination gave up partway. The distinction that matters:
 * shop-level counters come from a single call that either succeeded or aborted
 * the analysis, so sales velocity is unaffected — only the per-listing panels
 * are working from an incomplete set.
 */
export function PartialCaptureBanner({
  fetchedListingCount,
  expectedListingCount,
  errors,
}: PartialCaptureBannerProps) {
  return (
    <div className="flex gap-3 rounded-lg border border-status-confirmed-foreground/30 bg-status-confirmed p-4 text-status-confirmed-foreground">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <div className="flex flex-col gap-1">
        <p className="text-body font-medium">
          Incomplete capture — {formatNumber(fetchedListingCount)} of{" "}
          {formatNumber(expectedListingCount)} listings
        </p>
        <p className="text-caption">
          Sales, favorites and reviews are still accurate; they come from a single
          request. The listings table, tags, keywords and price charts are working from
          a partial set. Re-analyze to complete it.
        </p>
        {errors.length > 0 ? (
          <ul className="mt-1 list-inside list-disc text-caption opacity-80">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
