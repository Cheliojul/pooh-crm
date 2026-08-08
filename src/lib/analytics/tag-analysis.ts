import {
  MAX_ETSY_TAGS,
  type ListingMetrics,
  type TagAnalysis,
  type TagCoverageBucket,
  type TagStat,
} from "@/lib/shop-types"

/** A tag on one or two listings tells you nothing about what drives traffic. */
const MIN_SAMPLE_FOR_TRAFFIC_RANKING = 3

const TRAFFIC_RANKING_SIZE = 8

interface TagAccumulator {
  count: number
  priceSum: number
  priceCount: number
  viewsPerDaySum: number
  viewsPerDayCount: number
  favoriteRateSum: number
  favoriteRateCount: number
}

function emptyAccumulator(): TagAccumulator {
  return {
    count: 0,
    priceSum: 0,
    priceCount: 0,
    viewsPerDaySum: 0,
    viewsPerDayCount: 0,
    favoriteRateSum: 0,
    favoriteRateCount: 0,
  }
}

function mean(sum: number, count: number): number | null {
  return count > 0 ? sum / count : null
}

export function buildTagAnalysis(
  listings: ListingMetrics[],
  partial: boolean
): TagAnalysis {
  const accumulators = new Map<string, TagAccumulator>()
  const coverageCounts = new Map<number, number>()

  let tagTotal = 0
  let fullyTagged = 0
  let unusedTagSlots = 0

  for (const listing of listings) {
    const tagCount = Math.min(listing.tagCount, MAX_ETSY_TAGS)
    tagTotal += listing.tagCount
    if (listing.tagCount >= MAX_ETSY_TAGS) fullyTagged += 1
    unusedTagSlots += Math.max(MAX_ETSY_TAGS - listing.tagCount, 0)
    coverageCounts.set(tagCount, (coverageCounts.get(tagCount) ?? 0) + 1)

    for (const rawTag of listing.tags) {
      const tag = rawTag.trim().toLowerCase()
      if (!tag) continue

      let accumulator = accumulators.get(tag)
      if (!accumulator) {
        accumulator = emptyAccumulator()
        accumulators.set(tag, accumulator)
      }

      accumulator.count += 1
      if (listing.price !== null) {
        accumulator.priceSum += listing.price
        accumulator.priceCount += 1
      }
      if (listing.viewsPerDay !== null) {
        accumulator.viewsPerDaySum += listing.viewsPerDay
        accumulator.viewsPerDayCount += 1
      }
      if (listing.favoriteRate !== null) {
        accumulator.favoriteRateSum += listing.favoriteRate
        accumulator.favoriteRateCount += 1
      }
    }
  }

  const totalListings = listings.length

  const tags: TagStat[] = [...accumulators.entries()]
    .map(([tag, accumulator]) => ({
      tag,
      count: accumulator.count,
      share: totalListings > 0 ? accumulator.count / totalListings : 0,
      averagePrice: mean(accumulator.priceSum, accumulator.priceCount),
      averageViewsPerDay: mean(accumulator.viewsPerDaySum, accumulator.viewsPerDayCount),
      averageFavoriteRate: mean(
        accumulator.favoriteRateSum,
        accumulator.favoriteRateCount
      ),
    }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))

  const rankable = tags
    .filter(
      (tag) =>
        tag.count >= MIN_SAMPLE_FOR_TRAFFIC_RANKING && tag.averageViewsPerDay !== null
    )
    .sort((a, b) => (b.averageViewsPerDay ?? 0) - (a.averageViewsPerDay ?? 0))

  const coverage: TagCoverageBucket[] = Array.from(
    { length: MAX_ETSY_TAGS + 1 },
    (_, tagCount) => ({ tagCount, listings: coverageCounts.get(tagCount) ?? 0 })
  )

  return {
    partial,
    totalListings,
    uniqueTags: tags.length,
    averageTagsPerListing: totalListings > 0 ? tagTotal / totalListings : null,
    fullyTaggedShare: totalListings > 0 ? fullyTagged / totalListings : null,
    unusedTagSlots,
    coverage,
    tags,
    topByTraffic: rankable.slice(0, TRAFFIC_RANKING_SIZE),
    bottomByTraffic: rankable.slice(-TRAFFIC_RANKING_SIZE).reverse(),
  }
}
