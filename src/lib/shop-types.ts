// Types for the Etsy Shop Analyzer. Three groups live here:
//
//   1. Stored records  — the exact shape of the JSON written to `.data/`.
//   2. Analysis output — what `buildShopAnalysis()` hands to the components.
//   3. Action state    — the `useActionState` contract for the search form.
//
// Nothing in this file imports node builtins, so components and Storybook
// stories can import it freely.

/** Etsy allows 13 tags per listing. Unused slots are wasted SEO surface. */
export const MAX_ETSY_TAGS = 13

export type ProviderKind = "live" | "mock"

// ---------------------------------------------------------------------------
// 1. Stored records
// ---------------------------------------------------------------------------

/**
 * The per-listing numbers that change between captures. One of these is written
 * per listing per snapshot, so keep it small — roughly 110 bytes of JSON.
 */
export interface ListingMetricRow {
  listingId: number
  views: number
  numFavorers: number
  quantity: number
  /**
   * Price in the currency's minor units, exactly as Etsy reports it. Divide by
   * `priceDivisor` for the display value — never assume the divisor is 100.
   */
  priceMinor: number
  priceDivisor: number
  lastModifiedAt: string
}

/** Shop-level counters at capture time. All come from a single `getShop` call. */
export interface ShopCounters {
  transactionSoldCount: number
  numFavorers: number
  reviewCount: number
  reviewAverage: number | null
  activeListingCount: number
  digitalListingCount: number
  isVacation: boolean
}

/** One capture. Append-only: existing snapshot files are never rewritten. */
export interface ShopSnapshot {
  version: 1
  /** Epoch milliseconds as a decimal string — also the filename stem. */
  snapshotId: string
  shopId: number
  capturedAt: string
  /** True when listing pagination did not complete. Shop counters are still valid. */
  partial: boolean
  errors: string[]
  /** Every normalizer fallback taken during this capture. */
  warnings: string[]
  providerKind: ProviderKind
  shop: ShopCounters
  expectedListingCount: number
  fetchedListingCount: number
  listings: ListingMetricRow[]
}

/**
 * Descriptive listing data. Stored exactly once per shop and merged in place on
 * each analyze, which is what keeps snapshots cheap.
 */
export interface CatalogListing {
  listingId: number
  title: string
  descriptionExcerpt: string
  url: string
  imageUrl: string | null
  tags: string[]
  materials: string[]
  taxonomyId: number | null
  shopSectionId: number | null
  whoMade: string | null
  whenMade: string | null
  hasVariations: boolean
  isDigital: boolean
  /** Etsy's `original_creation_timestamp`. */
  createdAt: string
  /** When this analyzer first saw the listing — useful before Etsy history exists. */
  firstSeenAt: string
  lastSeenAt: string
}

export interface ShopListingCatalog {
  version: 1
  shopId: number
  updatedAt: string
  currencyCode: string
  listings: CatalogListing[]
}

export interface ShopProfile {
  shopId: number
  shopName: string
  title: string | null
  announcement: string | null
  url: string
  iconUrl: string | null
  bannerUrl: string | null
  currencyCode: string
  shopLocationCountry: string | null
  shippingFromCountry: string | null
  createdAt: string | null
  isVacation: boolean
  digitalListingCount: number
}

/**
 * A snapshot's headline numbers, denormalized into `shop.json`. The velocity
 * chart and every KPI trend read only this — no snapshot file is opened.
 */
export interface SnapshotMeta {
  snapshotId: string
  capturedAt: string
  partial: boolean
  fetchedListingCount: number
  expectedListingCount: number
  transactionSoldCount: number
  numFavorers: number
  reviewCount: number
  reviewAverage: number | null
  activeListingCount: number
  totalListingViews: number
  totalListingFavorers: number
}

export interface ShopRecord {
  version: 1
  shopId: number
  shopName: string
  profile: ShopProfile
  firstAnalyzedAt: string
  lastAnalyzedAt: string
  providerKind: ProviderKind
  /** Ascending by `capturedAt`. */
  snapshots: SnapshotMeta[]
}

/** One row of `index.json`. Denormalized so the list page reads a single file. */
export interface ShopIndexEntry {
  shopId: number
  shopName: string
  title: string | null
  url: string
  iconUrl: string | null
  currencyCode: string
  activeListingCount: number
  lifetimeSales: number
  numFavorers: number
  reviewCount: number
  reviewAverage: number | null
  snapshotCount: number
  recentSalesPerDay: number | null
  lastCapturePartial: boolean
  isVacation: boolean
  firstAnalyzedAt: string
  lastAnalyzedAt: string
}

// ---------------------------------------------------------------------------
// 2. Analysis output
// ---------------------------------------------------------------------------

export type VelocityStatus =
  | "ok"
  | "insufficient-snapshots"
  | "gap-too-short"
  | "anomaly"

export interface VelocityPoint {
  snapshotId: string
  capturedAt: string
  transactionSoldCount: number
  numFavorers: number
  /** Sales per day since the previous usable snapshot. Null on the first point. */
  salesPerDay: number | null
  favorersPerDay: number | null
  intervalDays: number | null
}

export interface ShopVelocity {
  status: VelocityStatus
  points: VelocityPoint[]
  recentSalesPerDay: number | null
  recentFavorersPerDay: number | null
  /** The interval `recentSalesPerDay` was measured over. */
  windowDays: number | null
  windowFrom: string | null
  windowTo: string | null
}

export interface ShopKpis {
  currencyCode: string
  activeListingCount: number
  digitalListingCount: number
  digitalShare: number | null
  lifetimeSales: number
  shopAgeDays: number | null
  lifetimeSalesPerDay: number | null
  recentSalesPerDay: number | null
  projectedSales30d: number | null
  averagePrice: number | null
  medianPrice: number | null
  /** lifetimeSales x averagePrice. An estimate — always render with a caveat. */
  estimatedLifetimeRevenue: number | null
  estimatedRevenuePerDay: number | null
  shopFavorers: number
  totalListingViews: number
  totalListingFavorers: number
  /** lifetimeSales / totalListingViews. Mixes lifetime sales with current views. */
  conversionProxy: number | null
  reviewCount: number
  reviewAverage: number | null
  reviewsPerSale: number | null
  listingsAdded30d: number
  listingsAdded90d: number
  isVacation: boolean
}

export interface ListingMetrics {
  listingId: number
  title: string
  url: string
  imageUrl: string | null
  price: number | null
  quantity: number
  tags: string[]
  tagCount: number
  createdAt: string
  daysLive: number | null
  views: number
  viewsPerDay: number | null
  favorers: number
  /** favorers / views. Null when views is zero. */
  favoriteRate: number | null
  viewsDelta: number | null
  viewsPerDayDelta: number | null
  favorersDelta: number | null
  /** Previous quantity minus current. A floor on units sold — sellers restock. */
  quantityDelta: number | null
  lastModifiedAt: string
  isDigital: boolean
  hasVariations: boolean
  whoMade: string | null
  whenMade: string | null
}

export interface TagStat {
  tag: string
  count: number
  share: number
  averagePrice: number | null
  averageViewsPerDay: number | null
  averageFavoriteRate: number | null
}

export interface TagCoverageBucket {
  tagCount: number
  listings: number
}

export interface TagAnalysis {
  partial: boolean
  totalListings: number
  uniqueTags: number
  averageTagsPerListing: number | null
  fullyTaggedShare: number | null
  /** Sum of (13 - tags.length) across the catalog. */
  unusedTagSlots: number
  coverage: TagCoverageBucket[]
  /** Descending by count. */
  tags: TagStat[]
  topByTraffic: TagStat[]
  bottomByTraffic: TagStat[]
}

export interface KeywordStat {
  keyword: string
  count: number
  share: number
  averageViewsPerDay: number | null
  /** Whether any listing using this keyword also carries it as a tag. */
  inTags: boolean
}

export interface KeywordAnalysis {
  partial: boolean
  unigrams: KeywordStat[]
  bigrams: KeywordStat[]
  /** Frequent in titles, absent from tags — the most actionable output here. */
  tagGaps: KeywordStat[]
  averageTitleWords: number | null
  averageTitleChars: number | null
}

export interface PriceBucket {
  label: string
  from: number
  to: number
  count: number
  share: number
  averageViewsPerDay: number | null
  averageFavoriteRate: number | null
}

export interface PriceDistribution {
  partial: boolean
  currencyCode: string
  buckets: PriceBucket[]
  min: number | null
  max: number | null
  mean: number | null
  median: number | null
  p25: number | null
  p75: number | null
}

export interface TimelineBucket {
  /** "2026-03" */
  month: string
  /** "Mar 2026" */
  label: string
  count: number
  cumulative: number
}

export interface ListingsTimeline {
  partial: boolean
  buckets: TimelineBucket[]
  busiestMonth: TimelineBucket | null
}

/** Everything the detail page renders. Built by `buildShopAnalysis()`. */
export interface ShopAnalysis {
  shopId: number
  shopName: string
  profile: ShopProfile
  currencyCode: string
  providerKind: ProviderKind
  firstAnalyzedAt: string
  lastAnalyzedAt: string
  snapshotCount: number
  /**
   * When the age-dependent figures (days live, views/day, "updated 3d ago") were
   * computed. Carried on the analysis so components never call `Date.now()`
   * during render, which is impure and non-deterministic.
   */
  generatedAt: number
  /** True when the most recent capture did not paginate all listings. */
  partial: boolean
  expectedListingCount: number
  fetchedListingCount: number
  kpis: ShopKpis
  velocity: ShopVelocity
  listings: ListingMetrics[]
  tags: TagAnalysis
  keywords: KeywordAnalysis
  prices: PriceDistribution
  timeline: ListingsTimeline
  warnings: string[]
  errors: string[]
}

// ---------------------------------------------------------------------------
// 3. Action state
// ---------------------------------------------------------------------------

export type AnalyzeState =
  | { status: "idle" }
  | { status: "error"; message: string }

/**
 * The analyze server action's signature. Components take this as a prop rather
 * than importing the action, so Storybook's browser runner never pulls `node:fs`
 * into the bundle.
 */
export type AnalyzeAction = (
  previous: AnalyzeState,
  formData: FormData
) => Promise<AnalyzeState>
