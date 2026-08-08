import { cn } from "@/lib/utils"

export interface BarSeriesDatum {
  key: string
  /** Axis label. Thinned automatically when the series is long. */
  label: string
  value: number
  /** Native tooltip text — carries the detail the bar itself cannot show. */
  title: string
}

export interface BarSeriesProps {
  data: BarSeriesDatum[]
  /** Screen-reader caption for the equivalent data table. */
  caption: string
  valueLabel: string
  categoryLabel: string
  emptyMessage?: string
  className?: string
}

/**
 * A single-series categorical bar chart in plain CSS, deliberately not a chart
 * library: these are fixed buckets with no interaction beyond a tooltip, so
 * recharts would ship ~90 KB of client JS for nothing. Stays a Server Component.
 */
export function BarSeries({
  data,
  caption,
  valueLabel,
  categoryLabel,
  emptyMessage = "Not enough data yet.",
  className,
}: BarSeriesProps) {
  if (data.length === 0) {
    return <p className="text-body text-muted-foreground">{emptyMessage}</p>
  }

  const max = Math.max(...data.map((datum) => datum.value), 1)
  // Long series (three years of months) would overlap every label, so thin them.
  const labelEvery = Math.ceil(data.length / 9)

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex h-40 items-end gap-1" aria-hidden="true">
        {data.map((datum) => (
          <div
            key={datum.key}
            title={datum.title}
            className="flex h-full flex-1 items-end"
          >
            <div
              className="w-full rounded-t-sm bg-chart-2 transition-colors hover:bg-chart-4"
              // A zero-count bucket still gets a sliver so the gap is visibly a
              // gap rather than a rendering failure.
              style={{ height: `${Math.max((datum.value / max) * 100, datum.value > 0 ? 2 : 1)}%` }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-1" aria-hidden="true">
        {data.map((datum, index) => (
          <div
            key={datum.key}
            className="min-w-0 flex-1 truncate text-center text-caption text-muted-foreground"
          >
            {index % labelEvery === 0 ? datum.label : ""}
          </div>
        ))}
      </div>

      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{categoryLabel}</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((datum) => (
            <tr key={datum.key}>
              <th scope="row">{datum.label}</th>
              <td>{datum.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
