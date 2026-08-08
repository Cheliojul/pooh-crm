// Sales velocity from stored snapshots.
//
// This is the only real time-series in the feature: Etsy exposes a lifetime
// `transaction_sold_count` and nothing else, so the delta between two captures
// is the only exact measure of how fast a shop is actually selling.
//
// Two guards matter more than the arithmetic:
//
//   - Minimum gap. Two analyses five minutes apart give a denominator of
//     0.003 days, which turns a single sale into "300/day". Intervals shorter
//     than the minimum are stored but never used as a denominator.
//   - Monotonicity. Lifetime sales should never fall. When it does, that is a
//     data anomaly, not zero sales — emit null and say so.

import type { ShopVelocity, SnapshotMeta, VelocityPoint } from "@/lib/shop-types"

const MS_PER_DAY = 86_400_000

/** Intervals shorter than this are not trusted as a velocity denominator. */
export const MIN_VELOCITY_GAP_HOURS = 24

/** Callers may lower the gap, but not below this. */
const MIN_VELOCITY_GAP_FLOOR_HOURS = 6

export interface VelocityOptions {
  minGapHours?: number
}

function elapsedDays(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / MS_PER_DAY
}

export function buildVelocity(
  snapshots: SnapshotMeta[],
  options: VelocityOptions = {}
): ShopVelocity {
  const minGapDays =
    Math.max(options.minGapHours ?? MIN_VELOCITY_GAP_HOURS, MIN_VELOCITY_GAP_FLOOR_HOURS) /
    24

  const ordered = [...snapshots].sort(
    (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
  )

  const points: VelocityPoint[] = []
  let sawAnomaly = false
  let recentSalesPerDay: number | null = null
  let recentFavorersPerDay: number | null = null
  let windowDays: number | null = null
  let windowFrom: string | null = null
  let windowTo: string | null = null

  for (let index = 0; index < ordered.length; index += 1) {
    const current = ordered[index]

    // Walk backwards for the most recent earlier capture that is far enough
    // away to be a trustworthy denominator.
    let baseline: SnapshotMeta | null = null
    for (let back = index - 1; back >= 0; back -= 1) {
      if (elapsedDays(ordered[back].capturedAt, current.capturedAt) >= minGapDays) {
        baseline = ordered[back]
        break
      }
    }

    let salesPerDay: number | null = null
    let favorersPerDay: number | null = null
    let intervalDays: number | null = null

    if (baseline) {
      intervalDays = elapsedDays(baseline.capturedAt, current.capturedAt)
      const salesDelta = current.transactionSoldCount - baseline.transactionSoldCount

      if (salesDelta < 0) {
        sawAnomaly = true
      } else if (intervalDays > 0) {
        salesPerDay = salesDelta / intervalDays
        favorersPerDay = (current.numFavorers - baseline.numFavorers) / intervalDays

        recentSalesPerDay = salesPerDay
        recentFavorersPerDay = favorersPerDay
        windowDays = intervalDays
        windowFrom = baseline.capturedAt
        windowTo = current.capturedAt
      }
    }

    points.push({
      snapshotId: current.snapshotId,
      capturedAt: current.capturedAt,
      transactionSoldCount: current.transactionSoldCount,
      numFavorers: current.numFavorers,
      salesPerDay,
      favorersPerDay,
      intervalDays,
    })
  }

  const status: ShopVelocity["status"] =
    ordered.length < 2
      ? "insufficient-snapshots"
      : recentSalesPerDay !== null
        ? "ok"
        : sawAnomaly
          ? "anomaly"
          : "gap-too-short"

  return {
    status,
    points,
    recentSalesPerDay,
    recentFavorersPerDay,
    windowDays,
    windowFrom,
    windowTo,
  }
}
