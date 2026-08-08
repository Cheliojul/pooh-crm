// The seam between the app and Etsy. Both the mock and the live implementation
// satisfy this interface, so nothing above this layer knows which one is running.

import type { EtsyListing, EtsyShop } from "@/lib/etsy/types"
import type { ProviderKind } from "@/lib/shop-types"

export class EtsyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EtsyError"
  }
}

export class EtsyNotFoundError extends EtsyError {
  constructor(message = "The Etsy resource was not found.") {
    super(message)
    this.name = "EtsyNotFoundError"
  }
}

export class EtsyAuthError extends EtsyError {
  constructor(message = "Etsy rejected the API key.") {
    super(message)
    this.name = "EtsyAuthError"
  }
}

export class EtsyRateLimitError extends EtsyError {
  readonly retryAfterMs: number | null

  constructor(message = "Etsy rate limit reached.", retryAfterMs: number | null = null) {
    super(message)
    this.name = "EtsyRateLimitError"
    this.retryAfterMs = retryAfterMs
  }
}

export class EtsyRequestError extends EtsyError {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "EtsyRequestError"
    this.status = status
  }
}

export interface EtsyListingsResult {
  listings: EtsyListing[]
  /** `listing_active_count` from the shop record. */
  expectedTotal: number
  /** True when pagination gave up partway. Shop-level counters stay valid. */
  partial: boolean
  errors: string[]
  warnings: string[]
}

export interface EtsyShopResult {
  shop: EtsyShop
  warnings: string[]
}

export interface EtsyProvider {
  readonly kind: ProviderKind
  /** Keyword search, then an exact case-insensitive `shop_name` match. */
  findShopByName(shopName: string): Promise<EtsyShopResult | null>
  getShop(shopId: number): Promise<EtsyShopResult>
  /** Used to resolve a listing URL back to its shop. */
  getListingShopId(listingId: number): Promise<number>
  listActiveListings(shop: EtsyShop): Promise<EtsyListingsResult>
}

/** Maps a thrown error to something worth showing under the search box. */
export function toUserMessage(error: unknown): string {
  if (error instanceof EtsyNotFoundError) {
    return "No Etsy shop matched that name or URL."
  }
  if (error instanceof EtsyAuthError) {
    return "Etsy rejected the API key. Check ETSY_API_KEY in .env.local."
  }
  if (error instanceof EtsyRateLimitError) {
    return "Etsy rate limit reached. Wait a moment and try again."
  }
  if (error instanceof EtsyRequestError) {
    return `Etsy returned an error (HTTP ${error.status}). Try again shortly.`
  }
  if (error instanceof Error) {
    return error.message
  }
  return "Something went wrong while analyzing that shop."
}
