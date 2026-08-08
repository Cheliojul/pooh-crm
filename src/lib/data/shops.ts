import "server-only"

// Mirrors the shape of src/lib/data/orders.ts: async functions returning domain
// types, called from the async Server Component page. The store behind them is
// JSON files today; swapping in a database means changing only this file and
// src/lib/store/*.

import { buildShopAnalysis } from "@/lib/analytics"
import type { ShopAnalysis, ShopIndexEntry } from "@/lib/shop-types"
import {
  readIndex,
  readListingCatalog,
  readShopRecord,
  readSnapshots,
} from "@/lib/store/shop-store"

export interface AnalyzedShopsView {
  shops: ShopIndexEntry[]
  /**
   * Read here rather than in the component: calling `Date.now()` during render
   * is impure, and the list needs a reference point for "last analyzed 3d ago".
   */
  generatedAt: number
}

export async function getAnalyzedShops(): Promise<AnalyzedShopsView> {
  return { shops: await readIndex(), generatedAt: Date.now() }
}

export async function getShopAnalysis(shopId: number): Promise<ShopAnalysis | null> {
  const [record, catalog, snapshots] = await Promise.all([
    readShopRecord(shopId),
    readListingCatalog(shopId),
    // Only the two most recent are needed: the charts run off the denormalized
    // snapshot index in shop.json, and the delta columns compare exactly two.
    readSnapshots(shopId, 2),
  ])

  if (!record || !catalog || snapshots.length === 0) return null

  const latest = snapshots[snapshots.length - 1]
  const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null

  return buildShopAnalysis({ record, catalog, latest, previous })
}
