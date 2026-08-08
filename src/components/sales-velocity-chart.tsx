"use client"

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatDate, formatDecimal, formatNumber } from "@/lib/analytics/format"
import type { ShopVelocity } from "@/lib/shop-types"

// This chart earns the recharts dependency the hand-rolled ones do not: captures
// land at irregular intervals, so the x-axis has to be a real time scale rather
// than evenly spaced categories.

interface VelocityDatum {
  timestamp: number
  capturedAt: string
  totalSales: number
  salesPerDay: number | null
  intervalDays: number | null
}

const EMPTY_MESSAGES: Record<ShopVelocity["status"], string | null> = {
  ok: null,
  "insufficient-snapshots":
    "Velocity needs two captures. Re-analyze this shop in a few days and the exact sales rate will appear here.",
  "gap-too-short":
    "The captures so far are less than a day apart, which is too short to measure a reliable rate. Re-analyze tomorrow.",
  anomaly:
    "Etsy reported fewer lifetime sales than a previous capture. That is a data anomaly, not a drop in sales — the next capture should resolve it.",
}

interface TooltipEntry {
  payload?: VelocityDatum
}

function VelocityTooltip(props: { active?: boolean; payload?: TooltipEntry[] }) {
  const datum = props.payload?.[0]?.payload
  if (!props.active || !datum) return null

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-caption text-popover-foreground shadow-md">
      <div className="font-medium">{formatDate(datum.capturedAt)}</div>
      <div className="text-muted-foreground">
        {formatNumber(datum.totalSales)} lifetime sales
      </div>
      <div className="text-muted-foreground">
        {datum.salesPerDay === null
          ? "No usable interval"
          : `${formatDecimal(datum.salesPerDay, 1)} sales/day over ${formatDecimal(
              datum.intervalDays,
              0
            )} days`}
      </div>
    </div>
  )
}

export interface SalesVelocityChartProps {
  velocity: ShopVelocity
}

export function SalesVelocityChart({ velocity }: SalesVelocityChartProps) {
  const message = EMPTY_MESSAGES[velocity.status]

  if (message) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center">
        <p className="text-body font-medium">Not enough history yet</p>
        <p className="max-w-md text-caption text-muted-foreground">{message}</p>
      </div>
    )
  }

  const data: VelocityDatum[] = velocity.points.map((point) => ({
    timestamp: new Date(point.capturedAt).getTime(),
    capturedAt: point.capturedAt,
    totalSales: point.transactionSoldCount,
    salesPerDay: point.salesPerDay,
    intervalDays: point.intervalDays,
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(value: number) => formatDate(new Date(value).toISOString())}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
          />
          <YAxis
            yAxisId="rate"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            width={40}
          />
          <YAxis
            yAxisId="total"
            orientation="right"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            width={52}
          />
          <Tooltip content={<VelocityTooltip />} cursor={{ fill: "var(--muted)" }} />
          {/* Chart tokens are intentionally greyscale, so the two series are
              separated by form and weight rather than hue. */}
          <Bar
            yAxisId="rate"
            dataKey="salesPerDay"
            name="Sales per day"
            fill="var(--chart-1)"
            radius={[3, 3, 0, 0]}
          />
          <Line
            yAxisId="total"
            type="monotone"
            dataKey="totalSales"
            name="Lifetime sales"
            stroke="var(--chart-5)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
