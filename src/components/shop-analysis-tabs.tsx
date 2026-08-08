import { KeywordGapPanel } from "@/components/keyword-gap-panel"
import { ListingsTimelineChart } from "@/components/listings-timeline-chart"
import { PriceHistogram } from "@/components/price-histogram"
import { ShopListingsTable } from "@/components/shop-listings-table"
import { TagAnalysisPanel } from "@/components/tag-analysis-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatNumber } from "@/lib/analytics/format"
import type { ShopAnalysis } from "@/lib/shop-types"

export interface ShopAnalysisTabsProps {
  analysis: ShopAnalysis
}

export function ShopAnalysisTabs({ analysis }: ShopAnalysisTabsProps) {
  return (
    <Tabs defaultValue="listings">
      <TabsList>
        <TabsTrigger value="listings">
          Listings ({formatNumber(analysis.listings.length)})
        </TabsTrigger>
        <TabsTrigger value="tags">Tags</TabsTrigger>
        <TabsTrigger value="keywords">Keywords</TabsTrigger>
        <TabsTrigger value="charts">Prices &amp; timeline</TabsTrigger>
      </TabsList>

      <TabsContent value="listings" className="mt-4">
        <ShopListingsTable
          listings={analysis.listings}
          currencyCode={analysis.currencyCode}
          now={analysis.generatedAt}
        />
      </TabsContent>

      <TabsContent value="tags" className="mt-4">
        <TagAnalysisPanel
          analysis={analysis.tags}
          currencyCode={analysis.currencyCode}
        />
      </TabsContent>

      <TabsContent value="keywords" className="mt-4">
        <KeywordGapPanel analysis={analysis.keywords} />
      </TabsContent>

      <TabsContent value="charts" className="mt-4">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="text-section-title font-semibold">Price distribution</h2>
            <PriceHistogram distribution={analysis.prices} />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-section-title font-semibold">Listings published</h2>
            <ListingsTimelineChart timeline={analysis.timeline} />
          </section>
        </div>
      </TabsContent>
    </Tabs>
  )
}
