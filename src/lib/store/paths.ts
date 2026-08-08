// The only module that knows the on-disk layout. Everything else asks here.
//
//   <root>/index.json
//   <root>/shops/<shopId>/shop.json
//   <root>/shops/<shopId>/listings.json
//   <root>/shops/<shopId>/snapshots/<epochMs>.json
//   <root>/shops/<shopId>/raw/…            (only when ETSY_DEBUG_RAW=1)

import path from "node:path"

/**
 * Overridable so tests and the first live API run can write somewhere
 * disposable instead of the real store.
 */
export function dataRoot(): string {
  const override = process.env.SHOP_DATA_DIR
  return override ? path.resolve(override) : path.join(process.cwd(), ".data")
}

/** Shop ids come from URLs, so refuse anything that could escape the data root. */
function segment(shopId: number): string {
  if (!Number.isSafeInteger(shopId) || shopId <= 0) {
    throw new Error(`Invalid shop id: ${String(shopId)}`)
  }
  return String(shopId)
}

export function indexFile(): string {
  return path.join(dataRoot(), "index.json")
}

export function shopsDir(): string {
  return path.join(dataRoot(), "shops")
}

export function shopDir(shopId: number): string {
  return path.join(shopsDir(), segment(shopId))
}

export function shopFile(shopId: number): string {
  return path.join(shopDir(shopId), "shop.json")
}

export function listingsFile(shopId: number): string {
  return path.join(shopDir(shopId), "listings.json")
}

export function snapshotsDir(shopId: number): string {
  return path.join(shopDir(shopId), "snapshots")
}

/**
 * `snapshotId` is epoch milliseconds as a decimal string. An ISO timestamp would
 * be more readable but contains ":", which NTFS rejects in filenames.
 */
export function snapshotFile(shopId: number, snapshotId: string): string {
  if (!/^\d+$/.test(snapshotId)) {
    throw new Error(`Invalid snapshot id: ${snapshotId}`)
  }
  return path.join(snapshotsDir(shopId), `${snapshotId}.json`)
}

export function rawDebugFile(shopId: number, label: string): string {
  const safeLabel = label.replace(/[^A-Za-z0-9._-]/g, "-")
  return path.join(shopDir(shopId), "raw", `${safeLabel}.json`)
}
