import "server-only"

import { randomBytes } from "node:crypto"
import { mkdir, open, readFile, rename, rm, unlink } from "node:fs/promises"
import path from "node:path"

/**
 * Windows throws EPERM/EBUSY when renaming over a file a watcher or AV scanner
 * has open. It is transient and never happens on POSIX, so it is easy to miss
 * until it bites in production on the one platform this runs on.
 */
const RENAME_RETRIES = 5

export async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === "ENOENT") return null
    throw error
  }
}

async function renameWithRetry(from: string, to: string): Promise<void> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await rename(from, to)
      return
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      const retryable = code === "EPERM" || code === "EBUSY" || code === "EACCES"
      if (!retryable || attempt >= RENAME_RETRIES) throw error
      await new Promise((resolve) => setTimeout(resolve, 25 * 2 ** attempt))
    }
  }
}

/**
 * Write to a temp file, flush it, then rename into place. A crash mid-write
 * leaves the previous file intact rather than a truncated one.
 */
export async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  const dir = path.dirname(filePath)
  await mkdir(dir, { recursive: true })

  const tmpPath = path.join(
    dir,
    `.${path.basename(filePath)}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`
  )

  const handle = await open(tmpPath, "w")
  try {
    await handle.writeFile(JSON.stringify(value), "utf8")
    await handle.sync()
  } finally {
    await handle.close()
  }

  try {
    await renameWithRetry(tmpPath, filePath)
  } catch (error) {
    await unlink(tmpPath).catch(() => {})
    throw error
  }
}

export async function removeDirectory(dirPath: string): Promise<void> {
  await rm(dirPath, { recursive: true, force: true })
}
