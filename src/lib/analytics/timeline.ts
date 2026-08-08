// When a shop published its listings — the clearest read on whether it is still
// actively building its catalogue or coasting on old inventory.

import { formatMonth } from "@/lib/analytics/format"
import type { ListingMetrics, ListingsTimeline, TimelineBucket } from "@/lib/shop-types"

/** Older months are folded into the cumulative seed rather than drawn. */
const MAX_MONTHS = 36

function monthKey(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

function addMonths(date: Date, count: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1))
}

export function buildTimeline(
  listings: ListingMetrics[],
  partial: boolean,
  now: number
): ListingsTimeline {
  if (listings.length === 0) {
    return { partial, buckets: [], busiestMonth: null }
  }

  const counts = new Map<string, number>()
  let earliest = Number.POSITIVE_INFINITY

  for (const listing of listings) {
    const created = new Date(listing.createdAt).getTime()
    if (Number.isNaN(created)) continue
    earliest = Math.min(earliest, created)
    const key = monthKey(new Date(created))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  if (!Number.isFinite(earliest)) {
    return { partial, buckets: [], busiestMonth: null }
  }

  const current = new Date(now)
  const lastMonth = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1))
  const firstMonth = new Date(
    Date.UTC(new Date(earliest).getUTCFullYear(), new Date(earliest).getUTCMonth(), 1)
  )

  const totalMonths =
    (lastMonth.getUTCFullYear() - firstMonth.getUTCFullYear()) * 12 +
    (lastMonth.getUTCMonth() - firstMonth.getUTCMonth()) +
    1

  const skipped = Math.max(totalMonths - MAX_MONTHS, 0)
  const windowStart = addMonths(firstMonth, skipped)

  // Listings older than the drawn window still count toward the cumulative line,
  // otherwise the curve would understate the catalogue size.
  let cumulative = 0
  for (let index = 0; index < skipped; index += 1) {
    cumulative += counts.get(monthKey(addMonths(firstMonth, index))) ?? 0
  }

  const buckets: TimelineBucket[] = []
  for (let index = 0; index < totalMonths - skipped; index += 1) {
    const month = monthKey(addMonths(windowStart, index))
    const count = counts.get(month) ?? 0
    cumulative += count
    buckets.push({ month, label: formatMonth(month), count, cumulative })
  }

  const busiestMonth = buckets.reduce<TimelineBucket | null>(
    (best, bucket) => (best === null || bucket.count > best.count ? bucket : best),
    null
  )

  return { partial, buckets, busiestMonth }
}
