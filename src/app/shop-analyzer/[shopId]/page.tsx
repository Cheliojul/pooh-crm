import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ExternalLink } from "lucide-react"

import { DeleteShopButton } from "@/components/delete-shop-button"
import { PartialCaptureBanner } from "@/components/partial-capture-banner"
import { ReAnalyzeButton } from "@/components/re-analyze-button"
import { SalesVelocityChart } from "@/components/sales-velocity-chart"
import { ShopAnalysisTabs } from "@/components/shop-analysis-tabs"
import { ShopKpiHeader } from "@/components/shop-kpi-header"
import { Badge } from "@/components/ui/badge"
import { analyzeShopAction, deleteShopAction } from "@/lib/actions/shops"
import { formatAgo, formatDate, formatNumber } from "@/lib/analytics/format"
import { getShopAnalysis } from "@/lib/data/shops"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Shop analysis",
}

function parseShopId(value: string): number | null {
  const shopId = Number(value)
  return Number.isSafeInteger(shopId) && shopId > 0 ? shopId : null
}

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ shopId: string }>
}) {
  const { shopId: shopIdParam } = await params
  const shopId = parseShopId(shopIdParam)
  if (shopId === null) notFound()

  const analysis = await getShopAnalysis(shopId)
  if (!analysis) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-page-title font-semibold">{analysis.shopName}</h1>
            {analysis.profile.isVacation ? (
              <Badge variant="outline">On vacation</Badge>
            ) : null}
            {analysis.providerKind === "mock" ? (
              <Badge
                variant="outline"
                title="Captured from local fixtures. Set ETSY_API_KEY in .env.local for live data."
              >
                Mock data
              </Badge>
            ) : null}
          </div>
          {analysis.profile.title ? (
            <p className="text-body text-muted-foreground">{analysis.profile.title}</p>
          ) : null}
          <p className="text-caption text-muted-foreground">
            {analysis.profile.shopLocationCountry
              ? `${analysis.profile.shopLocationCountry} · `
              : ""}
            Opened {formatDate(analysis.profile.createdAt)} ·{" "}
            {formatNumber(analysis.snapshotCount)} snapshot
            {analysis.snapshotCount === 1 ? "" : "s"} · last analyzed{" "}
            {formatAgo(analysis.lastAnalyzedAt, analysis.generatedAt)}
          </p>
          <a
            href={analysis.profile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1 text-caption text-muted-foreground hover:text-foreground"
          >
            View on Etsy
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </div>

        <div className="flex items-start gap-2">
          <DeleteShopButton
            shopId={analysis.shopId}
            shopName={analysis.shopName}
            deleteAction={deleteShopAction}
          />
          <ReAnalyzeButton
            shopId={analysis.shopId}
            analyzeAction={analyzeShopAction}
          />
        </div>
      </div>

      {analysis.partial ? (
        <PartialCaptureBanner
          fetchedListingCount={analysis.fetchedListingCount}
          expectedListingCount={analysis.expectedListingCount}
          errors={analysis.errors}
        />
      ) : null}

      <ShopKpiHeader analysis={analysis} />

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-section-title font-semibold">Sales velocity</h2>
          <p className="text-caption text-muted-foreground">
            Bars are sales per day between captures; the line is Etsy&apos;s lifetime
            sales counter. This is derived from your own snapshot history — Etsy
            publishes no sales trend.
          </p>
        </div>
        <SalesVelocityChart velocity={analysis.velocity} />
      </section>

      <ShopAnalysisTabs analysis={analysis} />
    </div>
  )
}
