import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatCurrency,
  formatDecimal,
  formatNumber,
  formatPercent,
} from "@/lib/analytics/format"
import { MAX_ETSY_TAGS, type TagAnalysis } from "@/lib/shop-types"

const TAG_ROW_LIMIT = 25

export interface TagAnalysisPanelProps {
  analysis: TagAnalysis
  currencyCode: string
}

export function TagAnalysisPanel({ analysis, currencyCode }: TagAnalysisPanelProps) {
  if (analysis.totalListings === 0) {
    return <p className="text-body text-muted-foreground">No listings captured yet.</p>
  }

  const maxCoverage = Math.max(...analysis.coverage.map((bucket) => bucket.listings), 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-lg border p-4">
          <span className="text-caption text-muted-foreground">Unique tags</span>
          <span className="font-heading text-page-title font-semibold tabular-nums">
            {formatNumber(analysis.uniqueTags)}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border p-4">
          <span className="text-caption text-muted-foreground">Avg tags / listing</span>
          <span className="font-heading text-page-title font-semibold tabular-nums">
            {formatDecimal(analysis.averageTagsPerListing, 1)}
            <span className="text-body text-muted-foreground"> / {MAX_ETSY_TAGS}</span>
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border p-4">
          <span className="text-caption text-muted-foreground">Fully tagged</span>
          <span className="font-heading text-page-title font-semibold tabular-nums">
            {formatPercent(analysis.fullyTaggedShare, 0)}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border p-4">
          <span className="text-caption text-muted-foreground">Unused tag slots</span>
          <span className="font-heading text-page-title font-semibold tabular-nums">
            {formatNumber(analysis.unusedTagSlots)}
          </span>
          <span className="text-caption text-muted-foreground">
            Across the whole shop
          </span>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-section-title font-semibold">Tag coverage</h3>
          <p className="text-caption text-muted-foreground">
            How many of the {MAX_ETSY_TAGS} available tag slots each listing uses.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          {analysis.coverage
            .filter((bucket) => bucket.listings > 0)
            .reverse()
            .map((bucket) => (
              <div key={bucket.tagCount} className="flex items-center gap-3">
                <span className="w-12 shrink-0 text-right text-caption tabular-nums text-muted-foreground">
                  {bucket.tagCount} tags
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded-sm bg-muted">
                  <div
                    className="h-full rounded-sm bg-chart-2"
                    style={{ width: `${(bucket.listings / maxCoverage) * 100}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-caption tabular-nums text-muted-foreground">
                  {formatNumber(bucket.listings)} listings
                </span>
              </div>
            ))}
        </div>
      </section>

      {analysis.topByTraffic.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div>
            <h3 className="text-section-title font-semibold">Tags that pull traffic</h3>
            <p className="text-caption text-muted-foreground">
              Average views per day across listings carrying each tag. Only tags on
              three or more listings are ranked.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.topByTraffic.map((tag) => (
              <Badge
                key={tag.tag}
                variant="secondary"
                title={`${formatDecimal(tag.averageViewsPerDay, 2)} views/day across ${tag.count} listings`}
              >
                {tag.tag}
                <span className="ml-1 tabular-nums text-muted-foreground">
                  {formatDecimal(tag.averageViewsPerDay, 1)}
                </span>
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h3 className="text-section-title font-semibold">All tags</h3>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead className="text-right">Listings</TableHead>
                <TableHead className="text-right">Share</TableHead>
                <TableHead className="text-right">Avg price</TableHead>
                <TableHead className="text-right">Views/day</TableHead>
                <TableHead className="text-right">Fav rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.tags.slice(0, TAG_ROW_LIMIT).map((tag) => (
                <TableRow key={tag.tag}>
                  <TableCell className="font-medium">{tag.tag}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(tag.count)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(tag.share, 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(tag.averagePrice, currencyCode)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDecimal(tag.averageViewsPerDay, 2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(tag.averageFavoriteRate, 1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {analysis.tags.length > TAG_ROW_LIMIT ? (
          <p className="text-caption text-muted-foreground">
            Showing the {TAG_ROW_LIMIT} most-used of {formatNumber(analysis.tags.length)}{" "}
            tags.
          </p>
        ) : null}
      </section>
    </div>
  )
}
