import type {
  ListingMetrics,
  PriceDistribution,
  ShopKpis,
  ShopProfile,
  ShopSnapshot,
  ShopVelocity,
} from "@/lib/shop-types"

const MS_PER_DAY = 86_400_000

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null
}

function countCreatedWithin(listings: ListingMetrics[], days: number, now: number): number {
  const cutoff = now - days * MS_PER_DAY
  return listings.filter((listing) => new Date(listing.createdAt).getTime() >= cutoff)
    .length
}

export function buildShopKpis(
  profile: ShopProfile,
  snapshot: ShopSnapshot,
  listings: ListingMetrics[],
  prices: PriceDistribution,
  velocity: ShopVelocity,
  now: number
): ShopKpis {
  const { shop } = snapshot

  const shopAgeDays = profile.createdAt
    ? Math.max((now - new Date(profile.createdAt).getTime()) / MS_PER_DAY, 0)
    : null

  const totalListingViews = listings.reduce((total, listing) => total + listing.views, 0)
  const totalListingFavorers = listings.reduce(
    (total, listing) => total + listing.favorers,
    0
  )

  const averagePrice = prices.mean
  const recentSalesPerDay = velocity.recentSalesPerDay

  // Etsy exposes no per-order revenue, so every currency figure below is
  // lifetime sales multiplied by an average price. It is wrong for any shop with
  // a wide price spread — the UI carries a caveat marker on each one.
  const estimatedLifetimeRevenue =
    averagePrice !== null ? shop.transactionSoldCount * averagePrice : null
  const estimatedRevenuePerDay =
    averagePrice !== null && recentSalesPerDay !== null
      ? recentSalesPerDay * averagePrice
      : null

  return {
    currencyCode: profile.currencyCode,
    activeListingCount: shop.activeListingCount,
    digitalListingCount: shop.digitalListingCount,
    digitalShare: ratio(shop.digitalListingCount, shop.activeListingCount),
    lifetimeSales: shop.transactionSoldCount,
    shopAgeDays,
    lifetimeSalesPerDay:
      shopAgeDays !== null && shopAgeDays > 0
        ? shop.transactionSoldCount / shopAgeDays
        : null,
    recentSalesPerDay,
    projectedSales30d: recentSalesPerDay !== null ? recentSalesPerDay * 30 : null,
    averagePrice,
    medianPrice: prices.median,
    estimatedLifetimeRevenue,
    estimatedRevenuePerDay,
    shopFavorers: shop.numFavorers,
    totalListingViews,
    totalListingFavorers,
    // Lifetime sales over current view counters — the two cover different
    // periods, so this is a directional signal only.
    conversionProxy: ratio(shop.transactionSoldCount, totalListingViews),
    reviewCount: shop.reviewCount,
    reviewAverage: shop.reviewAverage,
    reviewsPerSale: ratio(shop.reviewCount, shop.transactionSoldCount),
    listingsAdded30d: countCreatedWithin(listings, 30, now),
    listingsAdded90d: countCreatedWithin(listings, 90, now),
    isVacation: shop.isVacation,
  }
}
