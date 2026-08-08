import "server-only"

// Real Etsy Open API v3 client. Every endpoint used here is public — an API key
// alone is enough, no per-shop OAuth.
//
// Etsy has no CORS headers and the key must never reach the browser, so this
// module is server-only by construction as well as by directive.

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { normalizeListing, normalizeShop } from "@/lib/etsy/normalize"
import {
  EtsyAuthError,
  EtsyNotFoundError,
  EtsyRateLimitError,
  EtsyRequestError,
  type EtsyListingsResult,
  type EtsyProvider,
  type EtsyShopResult,
} from "@/lib/etsy/provider"
import { throttled } from "@/lib/etsy/throttle"
import type {
  EtsyListing,
  EtsyShop,
  RawEtsyListing,
  RawEtsyShop,
  RawPaginated,
} from "@/lib/etsy/types"
import { rawDebugFile } from "@/lib/store/paths"

const BASE_URL = "https://openapi.etsy.com/v3/application"

/** Etsy's maximum. */
const PAGE_SIZE = 100

const MAX_ATTEMPTS = 3
const BASE_BACKOFF_MS = 400

export interface LiveProviderOptions {
  apiKey: string
}

function isDebugRaw(): boolean {
  return process.env.ETSY_DEBUG_RAW === "1"
}

/**
 * `includes=Images` inflates responses substantially and can cause problems at
 * limit=100, so thumbnails are opt-in until a real shop proves it is safe.
 */
function includeImages(): boolean {
  return process.env.ETSY_INCLUDE_IMAGES === "1"
}

async function dumpRaw(shopId: number, label: string, payload: unknown): Promise<void> {
  if (!isDebugRaw()) return
  try {
    const file = rawDebugFile(shopId, label)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(payload, null, 2), "utf8")
  } catch {
    // Debug dumps must never break an analysis.
  }
}

function retryAfterMs(response: Response): number | null {
  const header = response.headers.get("retry-after")
  if (!header) return null
  const seconds = Number(header)
  return Number.isFinite(seconds) ? seconds * 1000 : null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function createLiveEtsyProvider(options: LiveProviderOptions): EtsyProvider {
  const { apiKey } = options

  async function requestOnce<T>(pathname: string, search: URLSearchParams): Promise<T> {
    const url = `${BASE_URL}${pathname}${search.size > 0 ? `?${search}` : ""}`
    const response = await throttled(() =>
      fetch(url, {
        headers: { "x-api-key": apiKey, accept: "application/json" },
        cache: "no-store",
      })
    )

    if (response.ok) return (await response.json()) as T

    // 401/403 and 404 are terminal — retrying a bad key or a missing shop just
    // burns quota.
    if (response.status === 401 || response.status === 403) {
      throw new EtsyAuthError()
    }
    if (response.status === 404) {
      throw new EtsyNotFoundError()
    }
    if (response.status === 429) {
      throw new EtsyRateLimitError(undefined, retryAfterMs(response))
    }
    throw new EtsyRequestError(
      response.status,
      `Etsy request failed: ${response.status} ${response.statusText}`
    )
  }

  async function request<T>(
    pathname: string,
    search: URLSearchParams = new URLSearchParams()
  ): Promise<T> {
    let lastError: unknown

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        return await requestOnce<T>(pathname, search)
      } catch (error) {
        lastError = error
        if (error instanceof EtsyAuthError || error instanceof EtsyNotFoundError) {
          throw error
        }
        if (attempt === MAX_ATTEMPTS) break

        const backoff =
          error instanceof EtsyRateLimitError && error.retryAfterMs !== null
            ? error.retryAfterMs
            : BASE_BACKOFF_MS * 2 ** (attempt - 1)
        await sleep(backoff)
      }
    }

    throw lastError
  }

  function toShopResult(raw: RawEtsyShop): EtsyShopResult {
    const { value, warnings } = normalizeShop(raw)
    return { shop: value, warnings }
  }

  return {
    kind: "live",

    async findShopByName(shopName) {
      const search = new URLSearchParams({ shop_name: shopName, limit: "25" })
      const payload = await request<RawPaginated<RawEtsyShop>>("/shops", search)

      // findShops is a keyword search: asking for "CozyKnitsCo" will happily
      // return "CozyKnitsCoUK". Only an exact name match counts.
      const wanted = shopName.toLowerCase()
      const match = payload.results?.find(
        (candidate) => candidate.shop_name?.toLowerCase() === wanted
      )
      if (!match) return null

      await dumpRaw(match.shop_id ?? 0, "find-shop", payload)
      return toShopResult(match)
    },

    async getShop(shopId) {
      const raw = await request<RawEtsyShop>(`/shops/${shopId}`)
      await dumpRaw(shopId, "get-shop", raw)
      return toShopResult(raw)
    },

    async getListingShopId(listingId) {
      const raw = await request<RawEtsyListing>(`/listings/${listingId}`)
      if (typeof raw.shop_id !== "number") {
        throw new EtsyNotFoundError("That listing is not attached to a shop.")
      }
      return raw.shop_id
    },

    async listActiveListings(shop: EtsyShop): Promise<EtsyListingsResult> {
      const listings: EtsyListing[] = []
      const warnings: string[] = []
      const errors: string[] = []

      let expectedTotal = shop.activeListingCount
      let offset = 0
      let page = 0

      for (;;) {
        const search = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
        })
        if (includeImages()) search.set("includes", "Images")

        let payload: RawPaginated<RawEtsyListing>
        try {
          payload = await request<RawPaginated<RawEtsyListing>>(
            `/shops/${shop.shopId}/listings/active`,
            search
          )
        } catch (error) {
          // A mid-pagination failure keeps whatever was already fetched and
          // marks the capture partial. Shop-level counters came from getShop and
          // are unaffected, so sales velocity stays trustworthy.
          errors.push(
            `Listing page starting at offset ${offset} failed: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
          break
        }

        if (page === 0) {
          await dumpRaw(shop.shopId, "listings-page-1", payload)
          if (typeof payload.count === "number") expectedTotal = payload.count
        }

        const results = payload.results ?? []
        for (const raw of results) {
          const { value, warnings: listingWarnings } = normalizeListing(
            raw,
            shop.currencyCode
          )
          listings.push(value)
          warnings.push(...listingWarnings)
        }

        offset += PAGE_SIZE
        page += 1
        if (results.length < PAGE_SIZE || offset >= expectedTotal) break
      }

      return {
        listings,
        expectedTotal,
        partial: errors.length > 0,
        errors,
        warnings,
      }
    },
  }
}
