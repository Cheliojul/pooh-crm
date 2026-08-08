// Pure transforms from provider output into stored records.
//
// The store writes these to disk and the mock data builds them from fixtures, so
// keeping them here means Storybook renders exactly the shapes production writes
// — with no node dependency anywhere in the module graph.

import { buildVelocity } from "@/lib/analytics/velocity"
import type { EtsyListing, EtsyShop } from "@/lib/etsy/types"
import type {
  CatalogListing,
  ListingMetricRow,
  ProviderKind,
  ShopIndexEntry,
  ShopListingCatalog,
  ShopProfile,
  ShopRecord,
  ShopSnapshot,
  SnapshotMeta,
} from "@/lib/shop-types"

export function toShopProfile(shop: EtsyShop): ShopProfile {
  return {
    shopId: shop.shopId,
    shopName: shop.shopName,
    title: shop.title,
    announcement: shop.announcement,
    url: shop.url,
    iconUrl: shop.iconUrl,
    bannerUrl: shop.bannerUrl,
    currencyCode: shop.currencyCode,
    shopLocationCountry: shop.shopLocationCountry,
    shippingFromCountry: shop.shippingFromCountry,
    createdAt: shop.createdAt,
    isVacation: shop.isVacation,
    digitalListingCount: shop.digitalListingCount,
  }
}

function toMetricRow(listing: EtsyListing): ListingMetricRow {
  return {
    listingId: listing.listingId,
    views: listing.views,
    numFavorers: listing.numFavorers,
    quantity: listing.quantity,
    priceMinor: listing.priceMinor,
    priceDivisor: listing.priceDivisor,
    lastModifiedAt: listing.lastModifiedAt,
  }
}

export interface BuildSnapshotInput {
  shop: EtsyShop
  listings: EtsyListing[]
  expectedTotal: number
  partial: boolean
  errors: string[]
  warnings: string[]
  providerKind: ProviderKind
  capturedAtMs: number
}

export function buildSnapshot(input: BuildSnapshotInput): ShopSnapshot {
  const { shop } = input

  return {
    version: 1,
    // Epoch milliseconds, because this doubles as the filename and NTFS rejects
    // the colons in an ISO timestamp.
    snapshotId: String(input.capturedAtMs),
    shopId: shop.shopId,
    capturedAt: new Date(input.capturedAtMs).toISOString(),
    partial: input.partial,
    errors: input.errors,
    // Duplicates pile up fast — one identical warning per listing otherwise.
    warnings: [...new Set(input.warnings)],
    providerKind: input.providerKind,
    shop: {
      transactionSoldCount: shop.transactionSoldCount,
      numFavorers: shop.numFavorers,
      reviewCount: shop.reviewCount,
      reviewAverage: shop.reviewAverage,
      activeListingCount: shop.activeListingCount,
      digitalListingCount: shop.digitalListingCount,
      isVacation: shop.isVacation,
    },
    expectedListingCount: input.expectedTotal,
    fetchedListingCount: input.listings.length,
    listings: input.listings.map(toMetricRow),
  }
}

export interface MergeCatalogOptions {
  capturedAt: string
  /** Only drop listings absent from the capture when the capture was complete. */
  prune: boolean
}

export function mergeCatalog(
  existing: ShopListingCatalog | null,
  shop: EtsyShop,
  listings: EtsyListing[],
  options: MergeCatalogOptions
): ShopListingCatalog {
  const merged = new Map<number, CatalogListing>()

  if (existing) {
    for (const listing of existing.listings) {
      merged.set(listing.listingId, listing)
    }
  }

  const seen = new Set<number>()

  for (const listing of listings) {
    seen.add(listing.listingId)
    const previous = merged.get(listing.listingId)

    merged.set(listing.listingId, {
      listingId: listing.listingId,
      title: listing.title,
      descriptionExcerpt: listing.descriptionExcerpt,
      url: listing.url,
      imageUrl: listing.imageUrl,
      tags: listing.tags,
      materials: listing.materials,
      taxonomyId: listing.taxonomyId,
      shopSectionId: listing.shopSectionId,
      whoMade: listing.whoMade,
      whenMade: listing.whenMade,
      hasVariations: listing.hasVariations,
      isDigital: listing.isDigital,
      createdAt: listing.createdAt,
      firstSeenAt: previous?.firstSeenAt ?? options.capturedAt,
      lastSeenAt: options.capturedAt,
    })
  }

  // A partial capture is missing listings it never fetched, not listings that
  // were removed. Pruning on a partial would silently delete real data.
  if (options.prune) {
    for (const listingId of merged.keys()) {
      if (!seen.has(listingId)) merged.delete(listingId)
    }
  }

  return {
    version: 1,
    shopId: shop.shopId,
    updatedAt: options.capturedAt,
    currencyCode: shop.currencyCode,
    listings: [...merged.values()].sort((a, b) => a.listingId - b.listingId),
  }
}

export function toSnapshotMeta(snapshot: ShopSnapshot): SnapshotMeta {
  let totalListingViews = 0
  let totalListingFavorers = 0
  for (const row of snapshot.listings) {
    totalListingViews += row.views
    totalListingFavorers += row.numFavorers
  }

  return {
    snapshotId: snapshot.snapshotId,
    capturedAt: snapshot.capturedAt,
    partial: snapshot.partial,
    fetchedListingCount: snapshot.fetchedListingCount,
    expectedListingCount: snapshot.expectedListingCount,
    transactionSoldCount: snapshot.shop.transactionSoldCount,
    numFavorers: snapshot.shop.numFavorers,
    reviewCount: snapshot.shop.reviewCount,
    reviewAverage: snapshot.shop.reviewAverage,
    activeListingCount: snapshot.shop.activeListingCount,
    totalListingViews,
    totalListingFavorers,
  }
}

/** Denormalized so the list page reads one file instead of one per shop. */
export function toIndexEntry(record: ShopRecord, snapshot: ShopSnapshot): ShopIndexEntry {
  return {
    shopId: record.shopId,
    shopName: record.shopName,
    title: record.profile.title,
    url: record.profile.url,
    iconUrl: record.profile.iconUrl,
    currencyCode: record.profile.currencyCode,
    activeListingCount: snapshot.shop.activeListingCount,
    lifetimeSales: snapshot.shop.transactionSoldCount,
    numFavorers: snapshot.shop.numFavorers,
    reviewCount: snapshot.shop.reviewCount,
    reviewAverage: snapshot.shop.reviewAverage,
    snapshotCount: record.snapshots.length,
    recentSalesPerDay: buildVelocity(record.snapshots).recentSalesPerDay,
    lastCapturePartial: snapshot.partial,
    isVacation: snapshot.shop.isVacation,
    firstAnalyzedAt: record.firstAnalyzedAt,
    lastAnalyzedAt: record.lastAnalyzedAt,
  }
}
