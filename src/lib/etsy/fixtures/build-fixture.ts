// Deterministic fixture generator producing payloads in RAW Etsy shape.
//
// Raw shape matters: the mock provider runs these through the same
// `normalize.ts` the live provider uses, so the normalizers are exercised from
// day one and only the transport layer is new code when the API key arrives.
//
// Everything is anchored to FIXTURE_NOW_MS rather than `Date.now()` so stories
// and snapshot tests produce identical numbers on every run.

import type { RawEtsyListing, RawEtsyShop } from "@/lib/etsy/types"

/** The frozen "today" every fixture is generated against. */
export const FIXTURE_NOW_MS = Date.parse("2026-08-08T12:00:00.000Z")

const SECONDS_PER_DAY = 86_400
const FIXTURE_NOW_SECONDS = Math.floor(FIXTURE_NOW_MS / 1000)

export interface RawFixture {
  shop: RawEtsyShop
  listings: RawEtsyListing[]
}

export interface FixtureConfig {
  seed: number
  shopId: number
  shopName: string
  title: string
  announcement: string
  currencyCode: string
  countryIso: string
  /** Days before FIXTURE_NOW that the shop opened. */
  ageDays: number
  transactionSoldCount: number
  numFavorers: number
  reviewCount: number
  reviewAverage: number
  listingCount: number
  /** Inclusive price range in major units. */
  priceRange: [number, number]
  adjectives: string[]
  nouns: string[]
  suffixes: string[]
  tagPool: string[]
  materials: string[]
  isDigital: boolean
}

/** mulberry32 — small, fast, and stable across engines. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(random: () => number, items: T[]): T {
  return items[Math.floor(random() * items.length)]
}

function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min)
}

function intBetween(random: () => number, min: number, max: number): number {
  return Math.floor(between(random, min, max + 1))
}

function shuffled<T>(random: () => number, items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function toTag(value: string): string {
  return value.toLowerCase()
}

export function buildFixture(config: FixtureConfig): RawFixture {
  const random = createRandom(config.seed)
  const shopCreatedSeconds = FIXTURE_NOW_SECONDS - config.ageDays * SECONDS_PER_DAY

  const listings: RawEtsyListing[] = []

  for (let index = 0; index < config.listingCount; index += 1) {
    const listingId = config.shopId * 1000 + index

    // Listings are spread across the shop's life, but nothing is newer than a
    // week old — brand new listings would have meaningless views-per-day.
    const createdSeconds = Math.floor(
      between(random, shopCreatedSeconds, FIXTURE_NOW_SECONDS - 7 * SECONDS_PER_DAY)
    )
    const daysLive = (FIXTURE_NOW_SECONDS - createdSeconds) / SECONDS_PER_DAY

    // A few listings carry most of the traffic, which is what makes the
    // views-per-day column worth sorting by.
    const isBreakout = random() < 0.08
    const viewsPerDay = isBreakout
      ? between(random, 6, 22)
      : between(random, 0.2, 3.5)
    const views = Math.round(viewsPerDay * daysLive)
    const favoriteRate = between(random, 0.004, 0.06)

    const priceMajor = between(random, config.priceRange[0], config.priceRange[1])
    const priceMinor = Math.round(priceMajor) * 100 - (random() < 0.6 ? 1 : 0)

    const adjective = pick(random, config.adjectives)
    const noun = pick(random, config.nouns)
    const suffix = pick(random, config.suffixes)

    // Most sellers use all 13 tag slots, but enough fall short that the
    // coverage histogram and the unused-slots count have something to show.
    const tagCount = random() < 0.55 ? 13 : intBetween(random, 5, 12)
    const tags = shuffled(random, config.tagPool).slice(0, tagCount).map(toTag)

    listings.push({
      listing_id: listingId,
      shop_id: config.shopId,
      title: `${adjective} ${noun} ${suffix}`,
      description: `${adjective} ${noun} ${suffix}. Handmade to order in small batches. ${config.announcement}`,
      state: "active",
      creation_timestamp: createdSeconds,
      original_creation_timestamp: createdSeconds,
      last_modified_timestamp: Math.floor(
        between(random, createdSeconds, FIXTURE_NOW_SECONDS)
      ),
      quantity: config.isDigital ? 999 : intBetween(random, 1, 40),
      url: `https://www.etsy.com/listing/${listingId}/${noun.toLowerCase()}-${suffix.toLowerCase()}`,
      num_favorers: Math.round(views * favoriteRate),
      views,
      tags,
      materials: config.materials,
      price: {
        amount: priceMinor,
        divisor: 100,
        currency_code: config.currencyCode,
      },
      taxonomy_id: 1000 + (index % 7),
      shop_section_id: 200 + (index % 4),
      who_made: config.isDigital ? "i_did" : pick(random, ["i_did", "collective"]),
      when_made: "made_to_order",
      listing_type: config.isDigital ? "download" : "physical",
      is_digital: config.isDigital,
      has_variations: random() < 0.35,
      images: [
        {
          listing_image_id: listingId,
          url_75x75: `https://i.etsystatic.com/mock/${listingId}/75x75.jpg`,
          url_570xN: `https://i.etsystatic.com/mock/${listingId}/570xN.jpg`,
          url_fullxfull: `https://i.etsystatic.com/mock/${listingId}/fullxfull.jpg`,
        },
      ],
    })
  }

  const shop: RawEtsyShop = {
    shop_id: config.shopId,
    shop_name: config.shopName,
    user_id: config.shopId + 7,
    created_timestamp: shopCreatedSeconds,
    title: config.title,
    announcement: config.announcement,
    currency_code: config.currencyCode,
    is_vacation: false,
    listing_active_count: config.listingCount,
    digital_listing_count: config.isDigital ? config.listingCount : 0,
    login_name: config.shopName,
    url: `https://www.etsy.com/shop/${config.shopName}`,
    image_url_760x100: `https://i.etsystatic.com/mock/${config.shopId}/banner.jpg`,
    icon_url_fullxfull: `https://i.etsystatic.com/mock/${config.shopId}/icon.jpg`,
    num_favorers: config.numFavorers,
    transaction_sold_count: config.transactionSoldCount,
    shipping_from_country_iso: config.countryIso,
    shop_location_country_iso: config.countryIso,
    review_count: config.reviewCount,
    review_average: config.reviewAverage,
  }

  return { shop, listings }
}
