// Joins the descriptive catalog to the two most recent snapshots to produce the
// rows the listings table renders. Every other analysis panel is derived from
// this output rather than from the raw store.

import type {
  CatalogListing,
  ListingMetricRow,
  ListingMetrics,
  ShopListingCatalog,
  ShopSnapshot,
} from "@/lib/shop-types"

const MS_PER_DAY = 86_400_000

/**
 * Below one day of history, views-per-day is noise: a listing published this
 * morning with 4 views is not getting 40 views/day.
 */
const MIN_DAYS_FOR_RATE = 1

function daysBetween(fromIso: string, toMs: number): number {
  return (toMs - new Date(fromIso).getTime()) / MS_PER_DAY
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null
}

function toMetrics(
  catalog: CatalogListing,
  row: ListingMetricRow,
  previousRow: ListingMetricRow | null,
  intervalDays: number | null,
  now: number
): ListingMetrics {
  const daysLive = daysBetween(catalog.createdAt, now)
  const usableAge = Number.isFinite(daysLive) && daysLive >= MIN_DAYS_FOR_RATE
  const viewsPerDay = usableAge ? row.views / daysLive : null

  const viewsDelta = previousRow ? row.views - previousRow.views : null
  const favorersDelta = previousRow ? row.numFavorers - previousRow.numFavorers : null

  return {
    listingId: catalog.listingId,
    title: catalog.title,
    url: catalog.url,
    imageUrl: catalog.imageUrl,
    price: row.priceDivisor > 0 ? row.priceMinor / row.priceDivisor : null,
    quantity: row.quantity,
    tags: catalog.tags,
    tagCount: catalog.tags.length,
    createdAt: catalog.createdAt,
    daysLive: Number.isFinite(daysLive) ? Math.max(daysLive, 0) : null,
    views: row.views,
    viewsPerDay,
    favorers: row.numFavorers,
    favoriteRate: ratio(row.numFavorers, row.views),
    viewsDelta,
    viewsPerDayDelta:
      viewsDelta !== null && intervalDays !== null && intervalDays > 0
        ? viewsDelta / intervalDays
        : null,
    favorersDelta,
    // Positive means stock went down. Sellers restock, so this is a floor on
    // units sold, never a count — the UI labels it as such.
    quantityDelta: previousRow ? previousRow.quantity - row.quantity : null,
    lastModifiedAt: row.lastModifiedAt,
    isDigital: catalog.isDigital,
    hasVariations: catalog.hasVariations,
    whoMade: catalog.whoMade,
    whenMade: catalog.whenMade,
  }
}

export function buildListingMetrics(
  catalog: ShopListingCatalog,
  latest: ShopSnapshot,
  previous: ShopSnapshot | null,
  now: number
): ListingMetrics[] {
  const catalogById = new Map(
    catalog.listings.map((listing) => [listing.listingId, listing])
  )

  // Deltas are only meaningful between two complete captures. A partial capture
  // is missing listings outright, which would read as a collapse in views.
  const comparable = previous !== null && !previous.partial && !latest.partial
  const previousById = comparable
    ? new Map(previous.listings.map((row) => [row.listingId, row]))
    : null

  const intervalDays =
    comparable && previous
      ? (new Date(latest.capturedAt).getTime() -
          new Date(previous.capturedAt).getTime()) /
        MS_PER_DAY
      : null

  const metrics: ListingMetrics[] = []

  for (const row of latest.listings) {
    const entry = catalogById.get(row.listingId)
    // A snapshot row without a catalog entry means the catalog write failed
    // partway. Skipping is right: there is no title or tag data to show.
    if (!entry) continue
    metrics.push(
      toMetrics(entry, row, previousById?.get(row.listingId) ?? null, intervalDays, now)
    )
  }

  return metrics
}
