import { describe, expect, it } from "vitest"

import { buildVelocity } from "@/lib/analytics/velocity"
import type { SnapshotMeta } from "@/lib/shop-types"

const MS_PER_DAY = 86_400_000
const BASE_MS = Date.parse("2026-08-08T12:00:00.000Z")

function snapshot(daysAgo: number, sold: number, favorers = 100): SnapshotMeta {
  const capturedAtMs = BASE_MS - daysAgo * MS_PER_DAY
  return {
    snapshotId: String(capturedAtMs),
    capturedAt: new Date(capturedAtMs).toISOString(),
    partial: false,
    fetchedListingCount: 10,
    expectedListingCount: 10,
    transactionSoldCount: sold,
    numFavorers: favorers,
    reviewCount: 0,
    reviewAverage: null,
    activeListingCount: 10,
    totalListingViews: 0,
    totalListingFavorers: 0,
  }
}

describe("buildVelocity", () => {
  it("has nothing to report from a single capture", () => {
    const velocity = buildVelocity([snapshot(0, 500)])

    expect(velocity.status).toBe("insufficient-snapshots")
    expect(velocity.recentSalesPerDay).toBeNull()
  })

  it("computes sales per day across a usable gap", () => {
    const velocity = buildVelocity([snapshot(7, 500), snapshot(0, 570)])

    expect(velocity.status).toBe("ok")
    expect(velocity.recentSalesPerDay).toBeCloseTo(10)
    expect(velocity.windowDays).toBeCloseTo(7)
  })

  it("refuses to divide by a five-minute gap", () => {
    // Without the guard this reports 288 sales/day from a single sale.
    const nearlyNow = BASE_MS - 5 * 60 * 1000
    const velocity = buildVelocity([
      {
        ...snapshot(0, 500),
        snapshotId: String(nearlyNow),
        capturedAt: new Date(nearlyNow).toISOString(),
      },
      snapshot(0, 501),
    ])

    expect(velocity.status).toBe("gap-too-short")
    expect(velocity.recentSalesPerDay).toBeNull()
  })

  it("measures against the last snapshot far enough back, not simply the previous one", () => {
    // A week-old capture, then two taken minutes apart today. The week-old one
    // is the only valid baseline.
    const velocity = buildVelocity([
      snapshot(7, 500),
      snapshot(0.002, 569),
      snapshot(0, 570),
    ])

    expect(velocity.status).toBe("ok")
    expect(velocity.recentSalesPerDay).toBeCloseTo(10)
  })

  it("reports an anomaly rather than zero when lifetime sales fall", () => {
    const velocity = buildVelocity([snapshot(7, 570), snapshot(0, 500)])

    expect(velocity.status).toBe("anomaly")
    expect(velocity.recentSalesPerDay).toBeNull()
  })

  it("tracks favorites alongside sales", () => {
    const velocity = buildVelocity([snapshot(10, 500, 200), snapshot(0, 500, 250)])

    expect(velocity.recentFavorersPerDay).toBeCloseTo(5)
  })
})
