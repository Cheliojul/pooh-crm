import "server-only"

// The only module that touches the shop store on disk. Everything above it goes
// through `src/lib/data/shops.ts`, which keeps the read API shaped the same as
// `src/lib/data/orders.ts` so a later swap to SQLite or Prisma is a one-file job.

import { readdir } from "node:fs/promises"

import type { EtsyListing, EtsyShop } from "@/lib/etsy/types"
import {
  buildSnapshot,
  mergeCatalog,
  toIndexEntry,
  toShopProfile,
  toSnapshotMeta,
} from "@/lib/shop-records"
import type {
  ProviderKind,
  ShopIndexEntry,
  ShopListingCatalog,
  ShopRecord,
  ShopSnapshot,
} from "@/lib/shop-types"
import { readJson, removeDirectory, writeJsonAtomic } from "@/lib/store/atomic-json"
import { withLock } from "@/lib/store/lock"
import {
  indexFile,
  listingsFile,
  shopDir,
  shopFile,
  snapshotFile,
  snapshotsDir,
} from "@/lib/store/paths"

/** index.json is shared across shops, so it gets its own lock key. */
const INDEX_LOCK = "index"

export async function readIndex(): Promise<ShopIndexEntry[]> {
  return (await readJson<ShopIndexEntry[]>(indexFile())) ?? []
}

export async function readShopRecord(shopId: number): Promise<ShopRecord | null> {
  return readJson<ShopRecord>(shopFile(shopId))
}

export async function readListingCatalog(
  shopId: number
): Promise<ShopListingCatalog | null> {
  return readJson<ShopListingCatalog>(listingsFile(shopId))
}

async function listSnapshotIds(shopId: number): Promise<string[]> {
  try {
    const entries = await readdir(snapshotsDir(shopId))
    return entries
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.slice(0, -".json".length))
      .filter((id) => /^\d+$/.test(id))
      .sort((a, b) => Number(a) - Number(b))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return []
    throw error
  }
}

/**
 * Reads the newest `limit` snapshots, ascending. Snapshot ids are epoch
 * milliseconds, so the tail can be selected without opening any file — which is
 * what keeps a shop with years of history cheap to render.
 */
export async function readSnapshots(
  shopId: number,
  limit = 2
): Promise<ShopSnapshot[]> {
  const ids = await listSnapshotIds(shopId)
  const wanted = limit > 0 ? ids.slice(-limit) : ids

  const snapshots = await Promise.all(
    wanted.map((id) => readJson<ShopSnapshot>(snapshotFile(shopId, id)))
  )

  return snapshots.filter((snapshot): snapshot is ShopSnapshot => snapshot !== null)
}

async function upsertIndexEntry(entry: ShopIndexEntry): Promise<void> {
  await withLock(INDEX_LOCK, async () => {
    const index = await readIndex()
    const next = index.filter((existing) => existing.shopId !== entry.shopId)
    next.push(entry)
    next.sort(
      (a, b) =>
        new Date(b.lastAnalyzedAt).getTime() - new Date(a.lastAnalyzedAt).getTime()
    )
    await writeJsonAtomic(indexFile(), next)
  })
}

export interface AppendSnapshotInput {
  shop: EtsyShop
  listings: EtsyListing[]
  expectedTotal: number
  partial: boolean
  errors: string[]
  warnings: string[]
  providerKind: ProviderKind
}

export interface AppendSnapshotResult {
  shopId: number
  snapshotId: string
  snapshotCount: number
}

export async function appendSnapshot(
  input: AppendSnapshotInput
): Promise<AppendSnapshotResult> {
  const shopId = input.shop.shopId

  return withLock(`shop:${shopId}`, async () => {
    const capturedAtMs = Date.now()

    // 1. Append-only: a new file per capture. History is never rewritten.
    const snapshot = buildSnapshot({ ...input, capturedAtMs })
    await writeJsonAtomic(snapshotFile(shopId, snapshot.snapshotId), snapshot)

    // 2. Descriptive catalogue: merged by listing id. Pruning listings absent
    //    from the capture is only safe when the capture was complete.
    const existingCatalog = await readListingCatalog(shopId)
    await writeJsonAtomic(
      listingsFile(shopId),
      mergeCatalog(existingCatalog, input.shop, input.listings, {
        capturedAt: snapshot.capturedAt,
        prune: !input.partial,
      })
    )

    // 3. The small record: profile plus the denormalized snapshot index that
    //    powers every chart without opening a snapshot file.
    const existing = await readShopRecord(shopId)
    const record: ShopRecord = {
      version: 1,
      shopId,
      shopName: input.shop.shopName,
      profile: toShopProfile(input.shop),
      firstAnalyzedAt: existing?.firstAnalyzedAt ?? snapshot.capturedAt,
      lastAnalyzedAt: snapshot.capturedAt,
      providerKind: input.providerKind,
      snapshots: [...(existing?.snapshots ?? []), toSnapshotMeta(snapshot)],
    }
    await writeJsonAtomic(shopFile(shopId), record)

    await upsertIndexEntry(toIndexEntry(record, snapshot))

    return {
      shopId,
      snapshotId: snapshot.snapshotId,
      snapshotCount: record.snapshots.length,
    }
  })
}

export async function deleteShop(shopId: number): Promise<void> {
  await withLock(`shop:${shopId}`, async () => {
    await removeDirectory(shopDir(shopId))
  })

  await withLock(INDEX_LOCK, async () => {
    const index = await readIndex()
    await writeJsonAtomic(
      indexFile(),
      index.filter((entry) => entry.shopId !== shopId)
    )
  })
}
