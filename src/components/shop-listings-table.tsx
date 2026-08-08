"use client"

import { useMemo, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from "lucide-react"

import { MetricCaveat } from "@/components/metric-caveat"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatAgo,
  formatCurrency,
  formatDecimal,
  formatNumber,
  formatPercent,
  formatSigned,
} from "@/lib/analytics/format"
import { MAX_ETSY_TAGS, type ListingMetrics } from "@/lib/shop-types"
import { cn } from "@/lib/utils"

/** Right-aligned so the digits line up down the column. */
const NUMERIC_COLUMNS = new Set([
  "price",
  "quantity",
  "daysLive",
  "views",
  "viewsPerDay",
  "favorers",
  "favoriteRate",
  "tagCount",
  "viewsDelta",
  "favorersDelta",
  "quantityDelta",
])

const QUANTITY_DELTA_CAVEAT =
  "Stock decrease since the previous capture. Sellers restock, so this is a floor on units sold, never a count."

function SortHeader({
  column,
  label,
  hint,
}: {
  column: Column<ListingMetrics, unknown>
  label: string
  hint?: string
}) {
  const sorted = column.getIsSorted()
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown

  return (
    <button
      type="button"
      title={hint}
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {label}
      <Icon className={cn("size-3", sorted ? "text-foreground" : "text-muted-foreground/60")} />
    </button>
  )
}

function buildColumns(currencyCode: string, now: number): ColumnDef<ListingMetrics>[] {
  return [
    {
      id: "title",
      header: ({ column }) => <SortHeader column={column} label="Listing" />,
      accessorFn: (listing) => listing.title,
      cell: ({ row }) => (
        <a
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-xs items-center gap-1 hover:underline"
        >
          <span className="truncate">{row.original.title}</span>
          <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
        </a>
      ),
    },
    {
      id: "price",
      header: ({ column }) => <SortHeader column={column} label="Price" />,
      accessorFn: (listing) => listing.price ?? 0,
      cell: ({ row }) => formatCurrency(row.original.price, currencyCode),
    },
    {
      id: "quantity",
      header: ({ column }) => <SortHeader column={column} label="Qty" />,
      accessorFn: (listing) => listing.quantity,
    },
    {
      id: "daysLive",
      header: ({ column }) => <SortHeader column={column} label="Days live" />,
      accessorFn: (listing) => listing.daysLive ?? 0,
      cell: ({ row }) => formatNumber(Math.floor(row.original.daysLive ?? 0)),
    },
    {
      id: "views",
      header: ({ column }) => <SortHeader column={column} label="Views" />,
      accessorFn: (listing) => listing.views,
      cell: ({ row }) => formatNumber(row.original.views),
    },
    {
      id: "viewsPerDay",
      header: ({ column }) => (
        <SortHeader
          column={column}
          label="Views/day"
          hint="Views divided by days live — the only fair way to compare an old listing with a new one."
        />
      ),
      accessorFn: (listing) => listing.viewsPerDay ?? -1,
      cell: ({ row }) => formatDecimal(row.original.viewsPerDay, 2),
    },
    {
      id: "favorers",
      header: ({ column }) => <SortHeader column={column} label="Favorites" />,
      accessorFn: (listing) => listing.favorers,
      cell: ({ row }) => formatNumber(row.original.favorers),
    },
    {
      id: "favoriteRate",
      header: ({ column }) => (
        <SortHeader
          column={column}
          label="Fav rate"
          hint="Favorites divided by views — how well a listing converts the attention it already gets."
        />
      ),
      accessorFn: (listing) => listing.favoriteRate ?? -1,
      cell: ({ row }) => formatPercent(row.original.favoriteRate, 1),
    },
    {
      id: "tagCount",
      header: ({ column }) => <SortHeader column={column} label="Tags" />,
      accessorFn: (listing) => listing.tagCount,
      cell: ({ row }) => (
        <Badge
          variant={row.original.tagCount >= MAX_ETSY_TAGS ? "secondary" : "outline"}
          className={cn(
            "tabular-nums",
            row.original.tagCount < MAX_ETSY_TAGS &&
              "bg-status-confirmed text-status-confirmed-foreground"
          )}
          title={
            row.original.tagCount < MAX_ETSY_TAGS
              ? `${MAX_ETSY_TAGS - row.original.tagCount} unused tag slots`
              : "All tag slots used"
          }
        >
          {row.original.tagCount}/{MAX_ETSY_TAGS}
        </Badge>
      ),
    },
    {
      id: "viewsDelta",
      header: ({ column }) => <SortHeader column={column} label="Δ views" />,
      accessorFn: (listing) => listing.viewsDelta ?? Number.NEGATIVE_INFINITY,
      cell: ({ row }) => formatSigned(row.original.viewsDelta),
    },
    {
      id: "favorersDelta",
      header: ({ column }) => <SortHeader column={column} label="Δ favs" />,
      accessorFn: (listing) => listing.favorersDelta ?? Number.NEGATIVE_INFINITY,
      cell: ({ row }) => formatSigned(row.original.favorersDelta),
    },
    {
      id: "quantityDelta",
      header: ({ column }) => (
        <SortHeader column={column} label="Stock ↓" hint={QUANTITY_DELTA_CAVEAT} />
      ),
      accessorFn: (listing) => listing.quantityDelta ?? Number.NEGATIVE_INFINITY,
      cell: ({ row }) =>
        row.original.quantityDelta === null ? (
          "—"
        ) : (
          <span>
            {formatSigned(row.original.quantityDelta)}
            <MetricCaveat explanation={QUANTITY_DELTA_CAVEAT} marker="?" />
          </span>
        ),
    },
    {
      id: "updated",
      header: ({ column }) => <SortHeader column={column} label="Updated" />,
      accessorFn: (listing) => listing.lastModifiedAt,
      cell: ({ row }) => formatAgo(row.original.lastModifiedAt, now),
    },
  ]
}

export interface ShopListingsTableProps {
  listings: ListingMetrics[]
  currencyCode: string
  /**
   * Reference point for "days live" and "updated". Passed in rather than read
   * from `Date.now()` here, which would be an impure render.
   */
  now: number
}

export function ShopListingsTable({
  listings,
  currencyCode,
  now,
}: ShopListingsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "viewsPerDay", desc: true },
  ])
  const [globalFilter, setGlobalFilter] = useState("")

  const columns = useMemo(() => buildColumns(currencyCode, now), [currencyCode, now])

  const table = useReactTable({
    data: listings,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    // Titles alone are not enough — searching by tag is how you check whether a
    // keyword is actually used across the shop.
    globalFilterFn: (row, _columnId, value: string) => {
      const needle = value.trim().toLowerCase()
      if (!needle) return true
      const listing = row.original
      return (
        listing.title.toLowerCase().includes(needle) ||
        listing.tags.some((tag) => tag.toLowerCase().includes(needle))
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const rows = table.getRowModel().rows

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Filter by title or tag…"
          aria-label="Filter listings by title or tag"
          className="sm:max-w-xs"
        />
        <span className="text-caption text-muted-foreground">
          {rows.length === listings.length
            ? `${formatNumber(listings.length)} listings`
            : `${formatNumber(rows.length)} of ${formatNumber(listings.length)} listings`}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "whitespace-nowrap",
                      NUMERIC_COLUMNS.has(header.column.id) && "text-right"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "whitespace-nowrap",
                        NUMERIC_COLUMNS.has(cell.column.id) && "text-right tabular-nums"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No listings match that filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
