"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getEtsyProvider } from "@/lib/etsy"
import { parseShopInput, type ShopInput } from "@/lib/etsy/parse-shop-input"
import {
  toUserMessage,
  type EtsyProvider,
  type EtsyShopResult,
} from "@/lib/etsy/provider"
import type { AnalyzeState } from "@/lib/shop-types"
import { appendSnapshot, deleteShop } from "@/lib/store/shop-store"

async function resolveShop(
  provider: EtsyProvider,
  input: ShopInput
): Promise<EtsyShopResult | null> {
  switch (input.kind) {
    case "shopName":
      return provider.findShopByName(input.shopName)
    case "shopId":
      return provider.getShop(input.shopId)
    case "listingId": {
      const shopId = await provider.getListingShopId(input.listingId)
      return provider.getShop(shopId)
    }
  }
}

export async function analyzeShopAction(
  _previous: AnalyzeState,
  formData: FormData
): Promise<AnalyzeState> {
  const parsed = parseShopInput(String(formData.get("shopInput") ?? ""))
  if (!parsed.ok) return { status: "error", message: parsed.error }

  let shopId: number

  try {
    const provider = getEtsyProvider()

    const resolved = await resolveShop(provider, parsed.value)
    if (!resolved) {
      return { status: "error", message: "No Etsy shop matched that name or URL." }
    }

    // Listing pagination never throws on a mid-page failure; it comes back
    // flagged partial so the shop-level counters — and therefore velocity —
    // still get recorded.
    const listings = await provider.listActiveListings(resolved.shop)

    const written = await appendSnapshot({
      shop: resolved.shop,
      listings: listings.listings,
      expectedTotal: listings.expectedTotal,
      partial: listings.partial,
      errors: listings.errors,
      warnings: [...resolved.warnings, ...listings.warnings],
      providerKind: provider.kind,
    })

    shopId = written.shopId
  } catch (error) {
    return { status: "error", message: toUserMessage(error) }
  }

  revalidatePath("/shop-analyzer")
  revalidatePath(`/shop-analyzer/${shopId}`)
  // Must stay outside the try: redirect signals by throwing, so a catch would
  // swallow it and report a phantom error.
  redirect(`/shop-analyzer/${shopId}`)
}

export async function deleteShopAction(formData: FormData): Promise<void> {
  const shopId = Number(formData.get("shopId"))
  if (!Number.isSafeInteger(shopId) || shopId <= 0) return

  await deleteShop(shopId)

  revalidatePath("/shop-analyzer")
  redirect("/shop-analyzer")
}
