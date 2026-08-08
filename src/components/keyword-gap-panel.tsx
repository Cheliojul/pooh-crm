import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDecimal, formatNumber, formatPercent } from "@/lib/analytics/format"
import type { KeywordAnalysis, KeywordStat } from "@/lib/shop-types"

export interface KeywordGapPanelProps {
  analysis: KeywordAnalysis
}

function KeywordTable({
  rows,
  categoryLabel,
}: {
  rows: KeywordStat[]
  categoryLabel: string
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{categoryLabel}</TableHead>
            <TableHead className="text-right">Listings</TableHead>
            <TableHead className="text-right">Share</TableHead>
            <TableHead className="text-right">Views/day</TableHead>
            <TableHead className="text-right">Tagged</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.keyword}>
              <TableCell className="font-medium">{row.keyword}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(row.count)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPercent(row.share, 0)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatDecimal(row.averageViewsPerDay, 2)}
              </TableCell>
              <TableCell className="text-right">
                {row.inTags ? (
                  <Badge variant="secondary">yes</Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-status-confirmed text-status-confirmed-foreground"
                  >
                    no
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function KeywordGapPanel({ analysis }: KeywordGapPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-section-title font-semibold">Tag gaps</h3>
          <p className="text-caption text-muted-foreground">
            Words this shop leans on in its listing titles but never puts in its tags.
            By definition, that is search surface it is not competing for.
          </p>
        </div>

        {analysis.tagGaps.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2">
              {analysis.tagGaps.map((gap) => (
                <Badge
                  key={gap.keyword}
                  variant="outline"
                  className="bg-status-confirmed text-status-confirmed-foreground"
                  title={`In ${gap.count} titles (${formatPercent(gap.share, 0)}), never tagged`}
                >
                  {gap.keyword}
                  <span className="ml-1 tabular-nums opacity-70">{gap.count}</span>
                </Badge>
              ))}
            </div>
            <KeywordTable rows={analysis.tagGaps} categoryLabel="Untagged keyword" />
          </>
        ) : (
          <p className="text-body text-muted-foreground">
            No gaps found — every keyword this shop uses often in titles also appears in
            its tags.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-section-title font-semibold">Top title keywords</h3>
          <p className="text-caption text-muted-foreground">
            Counted once per listing. Titles average{" "}
            {formatDecimal(analysis.averageTitleWords, 1)} meaningful words and{" "}
            {formatDecimal(analysis.averageTitleChars, 0)} characters.
          </p>
        </div>
        <KeywordTable rows={analysis.unigrams} categoryLabel="Keyword" />
      </section>

      {analysis.bigrams.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div>
            <h3 className="text-section-title font-semibold">Common phrases</h3>
            <p className="text-caption text-muted-foreground">
              Two-word sequences, which map more closely to how buyers actually search.
            </p>
          </div>
          <KeywordTable rows={analysis.bigrams} categoryLabel="Phrase" />
        </section>
      ) : null}
    </div>
  )
}
