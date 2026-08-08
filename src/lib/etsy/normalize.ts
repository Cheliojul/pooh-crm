// The single bridge between raw Etsy payloads and the rest of the app.
//
// Both providers run through here, so the mock exercises exactly the code the
// live API will. Every fallback taken pushes a string into `warnings`, which is
// persisted on the snapshot — when a shop looks wrong, that array is the answer.

import type {
  EtsyListing,
  EtsyShop,
  RawEtsyListing,
  RawEtsyListingImage,
  RawEtsyMoney,
  RawEtsyShop,
} from "@/lib/etsy/types"

const DESCRIPTION_EXCERPT_LENGTH = 300

/**
 * Anything above this is milliseconds, below it is seconds. Etsy documents
 * seconds, but the two are eleven orders of magnitude apart, so guessing is
 * safe and beats silently rendering 1970.
 */
const MILLISECOND_THRESHOLD = 1e11

export interface Normalized<T> {
  value: T
  warnings: string[]
}

export function secondsToIso(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null
  }
  const ms = value > MILLISECOND_THRESHOLD ? value : value * 1000
  const date = new Date(ms)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function toExcerpt(description: string | null | undefined): string {
  if (!description) return ""
  const collapsed = description.replace(/\s+/g, " ").trim()
  return collapsed.length <= DESCRIPTION_EXCERPT_LENGTH
    ? collapsed
    : `${collapsed.slice(0, DESCRIPTION_EXCERPT_LENGTH).trimEnd()}…`
}

function pickImageUrl(images: RawEtsyListingImage[] | undefined): string | null {
  const first = images?.[0]
  if (!first) return null
  return first.url_570xN ?? first.url_fullxfull ?? first.url_75x75 ?? null
}

function countOrZero(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : 0
}

function normalizePrice(
  price: RawEtsyMoney | undefined,
  fallbackCurrency: string,
  warn: (message: string) => void
): { priceMinor: number; priceDivisor: number; currencyCode: string } {
  const amount = price?.amount
  const divisor = price?.divisor

  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    warn("listing price.amount missing — treated as 0")
    return { priceMinor: 0, priceDivisor: 100, currencyCode: fallbackCurrency }
  }
  // Divisor is 100 for most currencies but 1 for JPY and others. Dividing by a
  // hardcoded 100 would understate those prices by 100x.
  if (typeof divisor !== "number" || !Number.isFinite(divisor) || divisor <= 0) {
    warn("listing price.divisor missing or invalid — assumed 100")
    return { priceMinor: amount, priceDivisor: 100, currencyCode: fallbackCurrency }
  }

  return {
    priceMinor: amount,
    priceDivisor: divisor,
    currencyCode: price?.currency_code ?? fallbackCurrency,
  }
}

export function normalizeShop(raw: RawEtsyShop): Normalized<EtsyShop> {
  const warnings: string[] = []
  const warn = (message: string) => warnings.push(message)

  const shopId = raw.shop_id
  if (typeof shopId !== "number") {
    throw new Error("Etsy shop response is missing shop_id")
  }

  const shopName = raw.shop_name ?? raw.login_name
  if (!shopName) warn(`shop ${shopId} has no shop_name — using the id as a name`)

  const createdAt = secondsToIso(raw.created_timestamp ?? raw.create_date)
  if (!createdAt) warn(`shop ${shopId} has no usable created_timestamp`)

  const currencyCode = raw.currency_code
  if (!currencyCode) warn(`shop ${shopId} has no currency_code — assumed USD`)

  return {
    warnings,
    value: {
      shopId,
      shopName: shopName ?? String(shopId),
      title: raw.title ?? null,
      announcement: raw.announcement ?? null,
      url: raw.url ?? `https://www.etsy.com/shop/${shopName ?? shopId}`,
      iconUrl: raw.icon_url_fullxfull ?? null,
      bannerUrl: raw.image_url_760x100 ?? null,
      currencyCode: currencyCode ?? "USD",
      shopLocationCountry: raw.shop_location_country_iso ?? null,
      shippingFromCountry: raw.shipping_from_country_iso ?? null,
      createdAt,
      isVacation: raw.is_vacation === true,
      activeListingCount: countOrZero(raw.listing_active_count),
      digitalListingCount: countOrZero(raw.digital_listing_count),
      transactionSoldCount: countOrZero(raw.transaction_sold_count),
      numFavorers: countOrZero(raw.num_favorers),
      reviewCount: countOrZero(raw.review_count),
      reviewAverage:
        typeof raw.review_average === "number" && Number.isFinite(raw.review_average)
          ? raw.review_average
          : null,
    },
  }
}

export function normalizeListing(
  raw: RawEtsyListing,
  fallbackCurrency: string
): Normalized<EtsyListing> {
  const warnings: string[] = []
  const warn = (message: string) => warnings.push(message)

  const listingId = raw.listing_id
  if (typeof listingId !== "number") {
    throw new Error("Etsy listing response is missing listing_id")
  }

  const createdAt =
    secondsToIso(raw.original_creation_timestamp ?? raw.creation_timestamp)
  if (!createdAt) warn(`listing ${listingId} has no usable creation timestamp`)

  const lastModifiedAt =
    secondsToIso(raw.last_modified_timestamp ?? raw.updated_timestamp) ?? createdAt

  // `views` is absent on some responses depending on shop settings. Treating a
  // missing value as 0 is right — every ratio that divides by it zero-guards.
  if (raw.views === undefined || raw.views === null) {
    warn(`listing ${listingId} has no views field — treated as 0`)
  }

  const { priceMinor, priceDivisor, currencyCode } = normalizePrice(
    raw.price,
    fallbackCurrency,
    warn
  )

  const nowIso = new Date().toISOString()

  return {
    warnings,
    value: {
      listingId,
      title: raw.title ?? "",
      descriptionExcerpt: toExcerpt(raw.description),
      url: raw.url ?? `https://www.etsy.com/listing/${listingId}`,
      imageUrl: pickImageUrl(raw.images),
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      materials: Array.isArray(raw.materials) ? raw.materials : [],
      taxonomyId: raw.taxonomy_id ?? null,
      shopSectionId: raw.shop_section_id ?? null,
      whoMade: raw.who_made ?? null,
      whenMade: raw.when_made ?? null,
      hasVariations: raw.has_variations === true,
      isDigital: raw.is_digital === true || raw.listing_type === "download",
      createdAt: createdAt ?? nowIso,
      lastModifiedAt: lastModifiedAt ?? nowIso,
      quantity: countOrZero(raw.quantity),
      views: countOrZero(raw.views),
      numFavorers: countOrZero(raw.num_favorers),
      priceMinor,
      priceDivisor,
      currencyCode,
    },
  }
}
