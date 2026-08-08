import "server-only"

import { createLiveEtsyProvider } from "@/lib/etsy/live-provider"
import { createMockEtsyProvider } from "@/lib/etsy/mock-provider"
import type { EtsyProvider } from "@/lib/etsy/provider"

let cached: EtsyProvider | null = null

/**
 * Picks the provider once per process.
 *
 *   ETSY_PROVIDER=auto (default) — live when ETSY_API_KEY is set, else mock
 *   ETSY_PROVIDER=mock           — force fixtures even with a key present
 *   ETSY_PROVIDER=live           — force live; fails loudly without a key
 *
 * Going from fixtures to the real API is therefore one line in .env.local and a
 * restart; no application code changes.
 */
export function getEtsyProvider(): EtsyProvider {
  if (cached) return cached

  const mode = process.env.ETSY_PROVIDER ?? "auto"
  const apiKey = process.env.ETSY_API_KEY?.trim()

  if (mode === "live" && !apiKey) {
    throw new Error("ETSY_PROVIDER=live requires ETSY_API_KEY to be set.")
  }

  const useMock = mode === "mock" || (mode !== "live" && !apiKey)
  cached = useMock
    ? createMockEtsyProvider()
    : createLiveEtsyProvider({ apiKey: apiKey as string })

  console.info(`[etsy] provider=${cached.kind}`)
  return cached
}
