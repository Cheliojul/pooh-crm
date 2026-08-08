"use client"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { OrderStatusBadge } from "@/components/order-status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Order } from "@/lib/types"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function formatCurrency(value: number | null) {
  return value === null ? "—" : currencyFormatter.format(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

const columns: ColumnDef<Order>[] = [
  {
    id: "client",
    header: "Client",
    accessorFn: (order) => order.client.name,
  },
  {
    id: "price",
    header: "Price",
    accessorFn: (order) => order.price,
    cell: ({ row }) => formatCurrency(row.original.price),
  },
  {
    id: "estimatedPrice",
    header: "Estimated Price",
    accessorFn: (order) => order.estimatedPrice,
    cell: ({ row }) => formatCurrency(row.original.estimatedPrice),
  },
  {
    id: "agreedPrice",
    header: "Agreed Price",
    accessorFn: (order) => order.agreedPrice,
    cell: ({ row }) => formatCurrency(row.original.agreedPrice),
  },
  {
    id: "deliveryDate",
    header: "Delivery Date",
    accessorFn: (order) => order.deliveryDate,
    cell: ({ row }) => formatDate(row.original.deliveryDate),
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (order) => order.status,
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  },
  {
    id: "updatedAt",
    header: "Updated",
    accessorFn: (order) => order.updatedAt,
    cell: ({ row }) => formatDateTime(row.original.updatedAt),
  },
]

export function OrdersTable({ data }: { data: Order[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                No orders.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
