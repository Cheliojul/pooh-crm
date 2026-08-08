import { describe, expect, it } from "vitest"

import { parseShopInput } from "@/lib/etsy/parse-shop-input"

describe("parseShopInput", () => {
  it("reads a plain shop URL", () => {
    expect(parseShopInput("https://www.etsy.com/shop/CozyKnitsCo")).toEqual({
      ok: true,
      value: { kind: "shopName", shopName: "CozyKnitsCo" },
    })
  })

  it("ignores a locale prefix and tracking query", () => {
    expect(
      parseShopInput("https://www.etsy.com/uk/shop/CozyKnitsCo?ref=simple-shop-header")
    ).toEqual({ ok: true, value: { kind: "shopName", shopName: "CozyKnitsCo" } })
  })

  it("accepts a URL with no protocol", () => {
    expect(parseShopInput("etsy.com/shop/CozyKnitsCo")).toEqual({
      ok: true,
      value: { kind: "shopName", shopName: "CozyKnitsCo" },
    })
  })

  it("reads a listing URL so a product link resolves to its shop", () => {
    expect(parseShopInput("https://www.etsy.com/listing/41827364/chunky-beanie")).toEqual({
      ok: true,
      value: { kind: "listingId", listingId: 41827364 },
    })
  })

  it("accepts a bare shop name", () => {
    expect(parseShopInput("  CozyKnitsCo  ")).toEqual({
      ok: true,
      value: { kind: "shopName", shopName: "CozyKnitsCo" },
    })
  })

  it("treats an all-digit input as a shop id", () => {
    expect(parseShopInput("41827364")).toEqual({
      ok: true,
      value: { kind: "shopId", shopId: 41827364 },
    })
  })

  it("rejects non-Etsy hosts", () => {
    const result = parseShopInput("https://www.amazon.com/shop/CozyKnitsCo")
    expect(result.ok).toBe(false)
  })

  it("rejects an Etsy URL that points at neither a shop nor a listing", () => {
    expect(parseShopInput("https://www.etsy.com/search?q=beanie").ok).toBe(false)
  })

  it("rejects empty and malformed names", () => {
    expect(parseShopInput("").ok).toBe(false)
    expect(parseShopInput("   ").ok).toBe(false)
    expect(parseShopInput("cozy knits co").ok).toBe(false)
  })
})
