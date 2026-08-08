import type { RawFixture } from "@/lib/etsy/fixtures/build-fixture"
import { cozyKnitsCo } from "@/lib/etsy/fixtures/cozy-knits-co"
import { tinderboxPress } from "@/lib/etsy/fixtures/tinderbox-press"

export { FIXTURE_NOW_MS } from "@/lib/etsy/fixtures/build-fixture"
export type { RawFixture } from "@/lib/etsy/fixtures/build-fixture"

export const FIXTURE_SHOPS: RawFixture[] = [cozyKnitsCo, tinderboxPress]

export function findFixtureByName(shopName: string): RawFixture | null {
  const wanted = shopName.toLowerCase()
  return (
    FIXTURE_SHOPS.find((fixture) => fixture.shop.shop_name?.toLowerCase() === wanted) ??
    null
  )
}

export function findFixtureById(shopId: number): RawFixture | null {
  return FIXTURE_SHOPS.find((fixture) => fixture.shop.shop_id === shopId) ?? null
}

export function findFixtureByListingId(listingId: number): RawFixture | null {
  return (
    FIXTURE_SHOPS.find((fixture) =>
      fixture.listings.some((listing) => listing.listing_id === listingId)
    ) ?? null
  )
}
