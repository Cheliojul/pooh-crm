// Fixture-backed provider. Used until ETSY_API_KEY is set, and afterwards via
// ETSY_PROVIDER=mock to iterate on UI without spending the 10k/day quota.
//
// It deliberately goes through the same pagination and normalization path as the
// live provider so partial captures, warnings, and page boundaries are all real.

import {
  findFixtureById,
  findFixtureByListingId,
  findFixtureByName,
} from "@/lib/etsy/fixtures"
import { normalizeListing, normalizeShop } from "@/lib/etsy/normalize"
import {
  EtsyNotFoundError,
  type EtsyListingsResult,
  type EtsyProvider,
  type EtsyShopResult,
} from "@/lib/etsy/provider"
import type { EtsyListing, EtsyShop, RawEtsyListing } from "@/lib/etsy/types"

/** Matches the live API's maximum page size, so page boundaries line up. */
const PAGE_SIZE = 100

type MockScenario = "ok" | "partial" | "slow" | "not-found"

function readScenario(): MockScenario {
  const raw =
    typeof process !== "undefined" ? process.env.ETSY_MOCK_SCENARIO : undefined
  if (raw === "partial" || raw === "slow" || raw === "not-found") return raw
  return "ok"
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizePage(
  page: RawEtsyListing[],
  currencyCode: string,
  listings: EtsyListing[],
  warnings: string[]
): void {
  for (const raw of page) {
    const { value, warnings: listingWarnings } = normalizeListing(raw, currencyCode)
    listings.push(value)
    warnings.push(...listingWarnings)
  }
}

export function createMockEtsyProvider(): EtsyProvider {
  const scenario = readScenario()

  async function shopResult(shopId: number): Promise<EtsyShopResult> {
    const fixture = findFixtureById(shopId)
    if (!fixture) throw new EtsyNotFoundError()
    const { value, warnings } = normalizeShop(fixture.shop)
    return { shop: value, warnings }
  }

  return {
    kind: "mock",

    async findShopByName(shopName) {
      if (scenario === "slow") await delay(600)
      if (scenario === "not-found") return null

      const fixture = findFixtureByName(shopName)
      if (!fixture) return null
      const { value, warnings } = normalizeShop(fixture.shop)
      return { shop: value, warnings }
    },

    async getShop(shopId) {
      if (scenario === "slow") await delay(400)
      return shopResult(shopId)
    },

    async getListingShopId(listingId) {
      const fixture = findFixtureByListingId(listingId)
      if (!fixture?.shop.shop_id) throw new EtsyNotFoundError()
      return fixture.shop.shop_id
    },

    async listActiveListings(shop: EtsyShop): Promise<EtsyListingsResult> {
      const fixture = findFixtureById(shop.shopId)
      if (!fixture) throw new EtsyNotFoundError()

      const listings: EtsyListing[] = []
      const warnings: string[] = []
      const errors: string[] = []
      const pageCount = Math.ceil(fixture.listings.length / PAGE_SIZE)

      for (let page = 0; page < pageCount; page += 1) {
        // Fail on the second page so the partial banner, the merge-don't-truncate
        // catalog rule, and the "shop counters survive" property all get exercised.
        if (scenario === "partial" && page === 1) {
          errors.push(
            `Listing page ${page + 1} of ${pageCount} failed: simulated upstream error`
          )
          break
        }
        if (scenario === "slow") await delay(250)

        const offset = page * PAGE_SIZE
        normalizePage(
          fixture.listings.slice(offset, offset + PAGE_SIZE),
          shop.currencyCode,
          listings,
          warnings
        )
      }

      return {
        listings,
        expectedTotal: shop.activeListingCount || fixture.listings.length,
        partial: errors.length > 0,
        errors,
        warnings,
      }
    },
  }
}
