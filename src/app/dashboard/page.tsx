import { DashboardTabs } from "@/components/dashboard-tabs"
import {
  getAllOrders,
  getOrdersReadyToWork,
  getOrdersToResearch,
} from "@/lib/data/orders"
import type { Role } from "@/lib/types"

function parseRole(value: string | undefined): Role {
  const upper = value?.toUpperCase()
  if (upper === "RESEARCHER" || upper === "SALES" || upper === "ADMIN") {
    return upper
  }
  return "ADMIN"
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role: roleParam } = await searchParams
  const role = parseRole(roleParam)

  // Each of these becomes a Prisma query later — DashboardTabs only cares
  // about the resulting Order[], not where it came from.
  const [toResearch, readyToWork, allOrders] = await Promise.all([
    getOrdersToResearch(),
    getOrdersReadyToWork(),
    getAllOrders(),
  ])

  return (
    <DashboardTabs
      role={role}
      toResearch={toResearch}
      readyToWork={readyToWork}
      allOrders={allOrders}
    />
  )
}
