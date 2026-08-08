// Turns whatever gets pasted into the search box into something we can look up.
// Pure and node-free so it can be unit-tested in Storybook's browser runner.

export type ShopInput =
  | { kind: "shopName"; shopName: string }
  | { kind: "shopId"; shopId: number }
  | { kind: "listingId"; listingId: number }

export type ParseShopInputResult =
  | { ok: true; value: ShopInput }
  | { ok: false; error: string }

/** Etsy shop names are letters and digits only, up to 20 characters. */
const SHOP_NAME_PATTERN = /^[A-Za-z0-9]{1,32}$/

const INVALID_URL = "That does not look like an Etsy shop or listing URL."

function looksLikeUrl(input: string): boolean {
  return (
    input.includes("://") ||
    input.startsWith("www.") ||
    input.toLowerCase().includes("etsy.com")
  )
}

function parseUrl(input: string): ParseShopInputResult {
  let url: URL
  try {
    url = new URL(input.includes("://") ? input : `https://${input}`)
  } catch {
    return { ok: false, error: INVALID_URL }
  }

  const host = url.hostname.toLowerCase()
  if (host !== "etsy.com" && !host.endsWith(".etsy.com")) {
    return { ok: false, error: "Only etsy.com URLs can be analyzed." }
  }

  // Etsy prefixes locale-specific URLs with a two-letter segment, e.g.
  // /uk/shop/Name. Dropping any leading two-letter segment handles all of them.
  const segments = url.pathname.split("/").filter(Boolean)
  if (segments[0]?.length === 2) segments.shift()

  const shopIndex = segments.indexOf("shop")
  if (shopIndex !== -1) {
    const shopName = segments[shopIndex + 1]
    if (!shopName) return { ok: false, error: INVALID_URL }
    return parseBare(decodeURIComponent(shopName))
  }

  const listingIndex = segments.indexOf("listing")
  if (listingIndex !== -1) {
    const listingId = Number(segments[listingIndex + 1])
    if (!Number.isInteger(listingId) || listingId <= 0) {
      return { ok: false, error: INVALID_URL }
    }
    return { ok: true, value: { kind: "listingId", listingId } }
  }

  return { ok: false, error: INVALID_URL }
}

function parseBare(input: string): ParseShopInputResult {
  if (/^\d+$/.test(input)) {
    const shopId = Number(input)
    if (!Number.isSafeInteger(shopId) || shopId <= 0) {
      return { ok: false, error: "That is not a valid Etsy shop id." }
    }
    return { ok: true, value: { kind: "shopId", shopId } }
  }

  if (!SHOP_NAME_PATTERN.test(input)) {
    return {
      ok: false,
      error: "Enter an Etsy shop URL, or a shop name using only letters and numbers.",
    }
  }

  return { ok: true, value: { kind: "shopName", shopName: input } }
}

export function parseShopInput(raw: string): ParseShopInputResult {
  const input = raw.trim()
  if (!input) {
    return { ok: false, error: "Paste an Etsy shop URL to analyze." }
  }
  return looksLikeUrl(input) ? parseUrl(input) : parseBare(input)
}
