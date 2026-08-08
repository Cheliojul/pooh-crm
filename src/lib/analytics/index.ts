// The single entry point the detail page uses. Everything under this module is
// pure, so it runs unchanged in a Server Component, a Storybook story, or a test.

import { buildKeywordAnalysis } from "@/lib/analytics/keyword-analysis"
import { buildListingMetrics } from "@/lib/analytics/listing-metrics"
import { buildPriceDistribution } from "@/lib/analytics/price-distribution"
import { buildShopKpis } from "@/lib/analytics/shop-kpis"
import { buildTagAnalysis } from "@/lib/analytics/tag-analysis"
import { buildTimeline } from "@/lib/analytics/timeline"
import { buildVelocity, type VelocityOptions } from "@/lib/analytics/velocity"
import type {
  ShopAnalysis,
  ShopListingCatalog,
  ShopRecord,
  ShopSnapshot,
} from "@/lib/shop-types"

export interface BuildShopAnalysisInput {
  record: ShopRecord
  catalog: ShopListingCatalog
  latest: ShopSnapshot
  /** The capture before `latest`, when one exists — powers the delta columns. */
  previous: ShopSnapshot | null
  /** Injectable so fixtures and tests produce stable numbers. */
  now?: number
  velocity?: VelocityOptions
}

export function buildShopAnalysis(input: BuildShopAnalysisInput): ShopAnalysis {
  const { record, catalog, latest, previous } = input
  const now = input.now ?? Date.now()

  const listings = buildListingMetrics(catalog, latest, previous, now)
  const velocity = buildVelocity(record.snapshots, input.velocity)
  const prices = buildPriceDistribution(listings, record.profile.currencyCode, latest.partial)

  return {
    shopId: record.shopId,
    shopName: record.shopName,
    profile: record.profile,
    currencyCode: record.profile.currencyCode,
    providerKind: record.providerKind,
    firstAnalyzedAt: record.firstAnalyzedAt,
    lastAnalyzedAt: record.lastAnalyzedAt,
    snapshotCount: record.snapshots.length,
    generatedAt: now,
    partial: latest.partial,
    expectedListingCount: latest.expectedListingCount,
    fetchedListingCount: latest.fetchedListingCount,
    kpis: buildShopKpis(record.profile, latest, listings, prices, velocity, now),
    velocity,
    listings,
    tags: buildTagAnalysis(listings, latest.partial),
    keywords: buildKeywordAnalysis(listings, latest.partial),
    prices,
    timeline: buildTimeline(listings, latest.partial, now),
    warnings: latest.warnings,
    errors: latest.errors,
  }
}

export { MIN_VELOCITY_GAP_HOURS } from "@/lib/analytics/velocity"
