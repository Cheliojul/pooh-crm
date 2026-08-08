import { describe, expect, it } from "vitest"

import { normalizeListing, normalizeShop, secondsToIso } from "@/lib/etsy/normalize"

describe("secondsToIso", () => {
  it("reads Etsy timestamps as seconds, not milliseconds", () => {
    // The bug this guards: new Date(1754654400) is 1970-01-21, not 2025.
    expect(secondsToIso(1754654400)).toBe("2025-08-08T12:00:00.000Z")
  })

  it("still handles a millisecond value if Etsy ever sends one", () => {
    expect(secondsToIso(1754654400000)).toBe("2025-08-08T12:00:00.000Z")
  })

  it("returns null for missing or nonsensical values", () => {
    expect(secondsToIso(undefined)).toBeNull()
    expect(secondsToIso(0)).toBeNull()
    expect(secondsToIso(-5)).toBeNull()
    expect(secondsToIso(Number.NaN)).toBeNull()
  })
})

describe("normalizeShop", () => {
  it("throws when shop_id is absent, since nothing downstream can key on it", () => {
    expect(() => normalizeShop({ shop_name: "NoId" })).toThrow(/shop_id/)
  })

  it("fills defaults and records a warning for each one taken", () => {
    const { value, warnings } = normalizeShop({ shop_id: 1, shop_name: "Bare" })

    expect(value.currencyCode).toBe("USD")
    expect(value.transactionSoldCount).toBe(0)
    expect(value.reviewAverage).toBeNull()
    expect(warnings.some((warning) => warning.includes("currency_code"))).toBe(true)
    expect(warnings.some((warning) => warning.includes("created_timestamp"))).toBe(true)
  })
})

describe("normalizeListing", () => {
  it("keeps the divisor rather than assuming 100", () => {
    // JPY has a divisor of 1. Dividing by a hardcoded 100 would report ¥2500
    // as ¥25.
    const { value } = normalizeListing(
      {
        listing_id: 9,
        price: { amount: 2500, divisor: 1, currency_code: "JPY" },
      },
      "USD"
    )

    expect(value.priceMinor).toBe(2500)
    expect(value.priceDivisor).toBe(1)
    expect(value.priceMinor / value.priceDivisor).toBe(2500)
    expect(value.currencyCode).toBe("JPY")
  })

  it("warns when the divisor is missing and falls back to 100", () => {
    const { value, warnings } = normalizeListing(
      { listing_id: 9, price: { amount: 1999 } },
      "GBP"
    )

    expect(value.priceDivisor).toBe(100)
    expect(warnings.some((warning) => warning.includes("divisor"))).toBe(true)
  })

  it("treats a missing views field as zero and says so", () => {
    const { value, warnings } = normalizeListing({ listing_id: 9 }, "USD")

    expect(value.views).toBe(0)
    expect(warnings.some((warning) => warning.includes("views"))).toBe(true)
  })

  it("truncates the description to an excerpt", () => {
    const { value } = normalizeListing(
      { listing_id: 9, description: `${"word ".repeat(200)}` },
      "USD"
    )

    expect(value.descriptionExcerpt.length).toBeLessThanOrEqual(301)
    expect(value.descriptionExcerpt.endsWith("…")).toBe(true)
  })
})
