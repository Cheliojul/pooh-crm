import type { ListingMetrics, PriceBucket, PriceDistribution } from "@/lib/shop-types"

const BUCKET_TARGET = 8

/** Bucket widths snap to one of these so axis labels stay readable. */
const NICE_STEPS = [1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]

function niceStep(rawWidth: number): number {
  if (!Number.isFinite(rawWidth) || rawWidth <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(rawWidth))
  for (const step of NICE_STEPS) {
    const candidate = step * magnitude
    if (candidate >= rawWidth) return candidate
  }
  return 10 * magnitude
}

function percentile(sorted: number[], fraction: number): number | null {
  if (sorted.length === 0) return null
  if (sorted.length === 1) return sorted[0]

  const position = (sorted.length - 1) * fraction
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((total, value) => total + value, 0) / values.length
}

export function buildPriceDistribution(
  listings: ListingMetrics[],
  currencyCode: string,
  partial: boolean
): PriceDistribution {
  const priced = listings.filter(
    (listing): listing is ListingMetrics & { price: number } => listing.price !== null
  )
  const sorted = priced.map((listing) => listing.price).sort((a, b) => a - b)

  const empty: PriceDistribution = {
    partial,
    currencyCode,
    buckets: [],
    min: null,
    max: null,
    mean: null,
    median: null,
    p25: null,
    p75: null,
  }

  if (sorted.length === 0) return empty

  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const step = niceStep((max - min) / BUCKET_TARGET)
  const start = Math.floor(min / step) * step
  const bucketCount = Math.max(Math.ceil((max - start) / step), 1)

  const groups: ListingMetrics[][] = Array.from({ length: bucketCount }, () => [])
  for (const listing of priced) {
    const index = Math.min(Math.floor((listing.price - start) / step), bucketCount - 1)
    groups[index].push(listing)
  }

  const buckets: PriceBucket[] = groups.map((group, index) => {
    const from = start + index * step
    const to = from + step
    const viewsPerDay = group
      .map((listing) => listing.viewsPerDay)
      .filter((value): value is number => value !== null)
    const favoriteRates = group
      .map((listing) => listing.favoriteRate)
      .filter((value): value is number => value !== null)

    return {
      label: `${from}–${to}`,
      from,
      to,
      count: group.length,
      share: group.length / priced.length,
      averageViewsPerDay: mean(viewsPerDay),
      averageFavoriteRate: mean(favoriteRates),
    }
  })

  return {
    partial,
    currencyCode,
    buckets,
    min,
    max,
    mean: mean(sorted),
    median: percentile(sorted, 0.5),
    p25: percentile(sorted, 0.25),
    p75: percentile(sorted, 0.75),
  }
}
