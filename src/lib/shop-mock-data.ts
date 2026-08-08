// Mock data for stories and for rendering the pages before persistence exists.
//
// This mirrors the role src/lib/mock-data.ts plays for orders, with one rule:
// everything is built by running fixtures through the REAL normalizers, record
// builders, and analytics. If a story looks right, the production path produces
// the same shape.
//
// Everything is anchored to FIXTURE_NOW_MS so the numbers never drift.

import { buildShopAnalysis } from "@/lib/analytics"
import { FIXTURE_NOW_MS, type RawFixture } from "@/lib/etsy/fixtures"
import { cozyKnitsCo } from "@/lib/etsy/fixtures/cozy-knits-co"
import { tinderboxPress } from "@/lib/etsy/fixtures/tinderbox-press"
import { normalizeListing, normalizeShop } from "@/lib/etsy/normalize"
import type { EtsyListing, EtsyShop } from "@/lib/etsy/types"
import {
  buildSnapshot,
  mergeCatalog,
  toIndexEntry,
  toShopProfile,
  toSnapshotMeta,
} from "@/lib/shop-records"
import type {
  ShopAnalysis,
  ShopIndexEntry,
  ShopListingCatalog,
  ShopRecord,
  ShopSnapshot,
} from "@/lib/shop-types"

const MS_PER_DAY = 86_400_000

const SNAPSHOT_INTERVAL_DAYS = 7

/** Roughly 1.1% of lifetime sales land in each weekly interval. */
const SALES_GROWTH_PER_INTERVAL = 0.011
const FAVORERS_GROWTH_PER_INTERVAL = 0.014
const VIEWS_GROWTH_PER_INTERVAL = 0.021

interface MockSeriesOptions {
  fixture: RawFixture
  snapshotCount: number
  /** Make the most recent capture partial, as if pagination failed midway. */
  partialLast?: boolean
}

interface MockShopData {
  record: ShopRecord
  catalog: ShopListingCatalog
  snapshots: ShopSnapshot[]
}

function scaleBack(value: number, rate: number, intervals: number): number {
  return Math.max(Math.round(value * (1 - rate * intervals)), 0)
}

function normalizeFixture(fixture: RawFixture): {
  shop: EtsyShop
  listings: EtsyListing[]
} {
  const { value: shop } = normalizeShop(fixture.shop)
  const listings = fixture.listings.map(
    (raw) => normalizeListing(raw, shop.currencyCode).value
  )
  return { shop, listings }
}

/** Rewinds a shop and its listings by `intervals` weeks. */
function rewind(
  shop: EtsyShop,
  listings: EtsyListing[],
  intervals: number
): { shop: EtsyShop; listings: EtsyListing[] } {
  if (intervals === 0) return { shop, listings }

  return {
    shop: {
      ...shop,
      transactionSoldCount: scaleBack(
        shop.transactionSoldCount,
        SALES_GROWTH_PER_INTERVAL,
        intervals
      ),
      numFavorers: scaleBack(shop.numFavorers, FAVORERS_GROWTH_PER_INTERVAL, intervals),
      reviewCount: scaleBack(shop.reviewCount, SALES_GROWTH_PER_INTERVAL, intervals),
    },
    listings: listings.map((listing) => ({
      ...listing,
      views: scaleBack(listing.views, VIEWS_GROWTH_PER_INTERVAL, intervals),
      numFavorers: scaleBack(listing.numFavorers, VIEWS_GROWTH_PER_INTERVAL, intervals),
      quantity: listing.quantity + (intervals % 3 === 0 ? 1 : 0),
    })),
  }
}

function buildMockShopData(options: MockSeriesOptions): MockShopData {
  const { fixture, snapshotCount } = options
  const { shop, listings } = normalizeFixture(fixture)

  const snapshots: ShopSnapshot[] = []

  for (let index = 0; index < snapshotCount; index += 1) {
    const intervalsAgo = snapshotCount - 1 - index
    const capturedAtMs = FIXTURE_NOW_MS - intervalsAgo * SNAPSHOT_INTERVAL_DAYS * MS_PER_DAY
    const isLast = index === snapshotCount - 1
    const partial = Boolean(options.partialLast && isLast)

    const rewound = rewind(shop, listings, intervalsAgo)
    // A partial capture stops mid-pagination, so it holds whole pages only.
    const captured = partial ? rewound.listings.slice(0, 100) : rewound.listings

    snapshots.push(
      buildSnapshot({
        shop: rewound.shop,
        listings: captured,
        expectedTotal: rewound.shop.activeListingCount,
        partial,
        errors: partial
          ? ["Listing page starting at offset 100 failed: simulated upstream error"]
          : [],
        warnings: [],
        providerKind: "mock",
        capturedAtMs,
      })
    )
  }

  const latest = snapshots[snapshots.length - 1]
  const catalog = mergeCatalog(null, shop, listings, {
    capturedAt: snapshots[0].capturedAt,
    prune: true,
  })

  const record: ShopRecord = {
    version: 1,
    shopId: shop.shopId,
    shopName: shop.shopName,
    profile: toShopProfile(shop),
    firstAnalyzedAt: snapshots[0].capturedAt,
    lastAnalyzedAt: latest.capturedAt,
    providerKind: "mock",
    snapshots: snapshots.map(toSnapshotMeta),
  }

  return { record, catalog, snapshots }
}

function toAnalysis(data: MockShopData): ShopAnalysis {
  const latest = data.snapshots[data.snapshots.length - 1]
  const previous = data.snapshots[data.snapshots.length - 2] ?? null
  return buildShopAnalysis({
    record: data.record,
    catalog: data.catalog,
    latest,
    previous,
    now: FIXTURE_NOW_MS,
  })
}

const cozyData = buildMockShopData({ fixture: cozyKnitsCo, snapshotCount: 6 })
const tinderboxData = buildMockShopData({ fixture: tinderboxPress, snapshotCount: 4 })
const cozyFirstRunData = buildMockShopData({ fixture: cozyKnitsCo, snapshotCount: 1 })
const cozyPartialData = buildMockShopData({
  fixture: cozyKnitsCo,
  snapshotCount: 3,
  partialLast: true,
})

/** A physical-goods shop with six weekly captures — the full-featured case. */
export const mockShopAnalysis: ShopAnalysis = toAnalysis(cozyData)

/** A smaller digital-download shop, for the second row and the digital-share KPI. */
export const mockShopAnalysisDigital: ShopAnalysis = toAnalysis(tinderboxData)

/** Just analyzed for the first time — velocity has nothing to work with yet. */
export const mockShopAnalysisFirstRun: ShopAnalysis = toAnalysis(cozyFirstRunData)

/** Pagination failed midway on the latest capture. */
export const mockShopAnalysisPartial: ShopAnalysis = toAnalysis(cozyPartialData)

export const mockShopIndex: ShopIndexEntry[] = [
  toIndexEntry(cozyData.record, cozyData.snapshots[cozyData.snapshots.length - 1]),
  toIndexEntry(
    tinderboxData.record,
    tinderboxData.snapshots[tinderboxData.snapshots.length - 1]
  ),
]

export const mockShopAnalyses: ShopAnalysis[] = [
  mockShopAnalysis,
  mockShopAnalysisDigital,
]

export { FIXTURE_NOW_MS }
