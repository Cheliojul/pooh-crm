// Sanity checks on the fixture -> normalize -> record -> analytics pipeline.
// If any of these fail, every story built on the mock data is showing nonsense.

import { describe, expect, it } from "vitest"

import {
  mockShopAnalysis,
  mockShopAnalysisDigital,
  mockShopAnalysisFirstRun,
  mockShopAnalysisPartial,
  mockShopIndex,
} from "@/lib/shop-mock-data"

describe("mockShopAnalysis", () => {
  it("carries every listing through to metrics", () => {
    expect(mockShopAnalysis.listings).toHaveLength(142)
    expect(mockShopAnalysis.partial).toBe(false)
  })

  it("produces sane headline numbers", () => {
    const { kpis } = mockShopAnalysis

    expect(kpis.lifetimeSales).toBe(8642)
    expect(kpis.shopAgeDays).toBeGreaterThan(1400)
    expect(kpis.lifetimeSalesPerDay).toBeGreaterThan(0)
    expect(kpis.averagePrice).toBeGreaterThan(0)
    expect(kpis.estimatedLifetimeRevenue).toBeGreaterThan(0)
    expect(kpis.conversionProxy).toBeGreaterThan(0)
    expect(kpis.currencyCode).toBe("GBP")
  })

  it("derives real sales velocity from the snapshot series", () => {
    expect(mockShopAnalysis.snapshotCount).toBe(6)
    expect(mockShopAnalysis.velocity.status).toBe("ok")
    expect(mockShopAnalysis.velocity.recentSalesPerDay).toBeGreaterThan(0)
    expect(mockShopAnalysis.velocity.points).toHaveLength(6)
  })

  it("fills the delta columns from the previous capture", () => {
    const withDelta = mockShopAnalysis.listings.filter(
      (listing) => listing.viewsDelta !== null
    )
    expect(withDelta.length).toBeGreaterThan(0)
    expect(withDelta.some((listing) => (listing.viewsDelta ?? 0) > 0)).toBe(true)
  })

  it("finds the keywords the fixture deliberately leaves untagged", () => {
    const gaps = mockShopAnalysis.keywords.tagGaps.map((stat) => stat.keyword)

    // "chunky" and "merino" appear in fixture titles but are absent from its tag
    // pool — exactly what the tag-gap panel exists to surface.
    expect(gaps).toContain("chunky")
    expect(gaps).toContain("merino")
    expect(mockShopAnalysis.keywords.tagGaps.every((stat) => !stat.inTags)).toBe(true)
    expect(
      mockShopAnalysis.keywords.tagGaps.every((stat) => stat.count >= 3)
    ).toBe(true)
  })

  it("does not report a tagged keyword as a gap", () => {
    const gaps = mockShopAnalysis.keywords.tagGaps.map((stat) => stat.keyword)

    // "beanie" and "scarf" are all over the titles but are also tagged, so they
    // are working keywords rather than gaps.
    expect(gaps).not.toContain("beanie")
    expect(gaps).not.toContain("scarf")
  })

  it("builds a price histogram and a publishing timeline", () => {
    expect(mockShopAnalysis.prices.buckets.length).toBeGreaterThan(1)
    expect(mockShopAnalysis.prices.median).toBeGreaterThan(0)
    expect(mockShopAnalysis.timeline.buckets.length).toBeGreaterThan(1)
    expect(mockShopAnalysis.timeline.busiestMonth).not.toBeNull()
  })

  it("counts unused tag slots", () => {
    expect(mockShopAnalysis.tags.unusedTagSlots).toBeGreaterThan(0)
    expect(mockShopAnalysis.tags.uniqueTags).toBeGreaterThan(5)
  })
})

describe("mockShopAnalysisFirstRun", () => {
  it("leaves velocity empty until there is a second capture", () => {
    expect(mockShopAnalysisFirstRun.snapshotCount).toBe(1)
    expect(mockShopAnalysisFirstRun.velocity.status).toBe("insufficient-snapshots")
    expect(mockShopAnalysisFirstRun.kpis.recentSalesPerDay).toBeNull()
    expect(mockShopAnalysisFirstRun.kpis.projectedSales30d).toBeNull()
  })

  it("still reports everything that needs only one capture", () => {
    expect(mockShopAnalysisFirstRun.kpis.lifetimeSales).toBeGreaterThan(0)
    expect(mockShopAnalysisFirstRun.listings.length).toBeGreaterThan(0)
  })
})

describe("mockShopAnalysisPartial", () => {
  it("keeps shop counters but marks the capture incomplete", () => {
    expect(mockShopAnalysisPartial.partial).toBe(true)
    expect(mockShopAnalysisPartial.fetchedListingCount).toBe(100)
    expect(mockShopAnalysisPartial.expectedListingCount).toBe(142)
    expect(mockShopAnalysisPartial.kpis.lifetimeSales).toBeGreaterThan(0)
    expect(mockShopAnalysisPartial.errors.length).toBeGreaterThan(0)
  })

  it("suppresses per-listing deltas, which a partial capture cannot support", () => {
    expect(
      mockShopAnalysisPartial.listings.every((listing) => listing.viewsDelta === null)
    ).toBe(true)
  })

  it("still reports shop-level velocity, which does not depend on pagination", () => {
    expect(mockShopAnalysisPartial.velocity.recentSalesPerDay).toBeGreaterThan(0)
  })
})

describe("mockShopIndex", () => {
  it("summarises each analyzed shop for the list page", () => {
    expect(mockShopIndex).toHaveLength(2)
    expect(mockShopIndex[0].shopName).toBe("CozyKnitsCo")
    expect(mockShopIndex[0].recentSalesPerDay).toBeGreaterThan(0)
    expect(mockShopIndex[1].shopName).toBe("TinderboxPress")
  })
})

describe("mockShopAnalysisDigital", () => {
  it("reports a fully digital catalogue", () => {
    expect(mockShopAnalysisDigital.kpis.digitalShare).toBe(1)
    expect(mockShopAnalysisDigital.listings.every((listing) => listing.isDigital)).toBe(
      true
    )
  })
})
