import type { Metadata } from "next"

import { AnalyzedShopsList } from "@/components/analyzed-shops-list"
import { ShopSearchForm } from "@/components/shop-search-form"
import { analyzeShopAction } from "@/lib/actions/shops"
import { getAnalyzedShops } from "@/lib/data/shops"

// This page reads the filesystem and touches no request-time API, so without
// this it is a prerender candidate and would serve a build-time-empty list.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Shop Analyzer",
}

export default async function ShopAnalyzerPage() {
  const { shops, generatedAt } = await getAnalyzedShops()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-page-title font-semibold">Shop Analyzer</h1>
          <p className="text-body text-muted-foreground">
            Pull public Etsy data for any shop, store it locally, and track how it
            changes over time.
          </p>
        </div>
        <ShopSearchForm analyzeAction={analyzeShopAction} />
      </div>

      <AnalyzedShopsList shops={shops} now={generatedAt} />
    </div>
  )
}
