import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/lib/types"

const STATUS_STYLES: Record<OrderStatus, string> = {
  NEW: "bg-status-new text-status-new-foreground",
  CONFIRMED: "bg-status-confirmed text-status-confirmed-foreground",
  SCHEDULED: "bg-status-scheduled text-status-scheduled-foreground",
  DELIVERED: "bg-status-delivered text-status-delivered-foreground",
  CANCELLED: "bg-status-cancelled text-status-cancelled-foreground",
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "New",
  CONFIRMED: "Confirmed",
  SCHEDULED: "Scheduled",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
