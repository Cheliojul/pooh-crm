import Link from "next/link"

import { OrdersTable } from "@/components/orders-table"
import { buttonVariants } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Order, Role } from "@/lib/types"

const ROLES: { value: Role; label: string }[] = [
  { value: "RESEARCHER", label: "Researcher" },
  { value: "SALES", label: "Sales" },
  { value: "ADMIN", label: "Admin" },
]

export interface DashboardTabsProps {
  role: Role
  toResearch: Order[]
  readyToWork: Order[]
  allOrders: Order[]
  /** Base path used by the role switcher links. Defaults to "/dashboard". */
  basePath?: string
}

export function DashboardTabs({
  role,
  toResearch,
  readyToWork,
  allOrders,
  basePath = "/dashboard",
}: DashboardTabsProps) {
  const tabs: { value: string; label: string; data: Order[] }[] =
    role === "RESEARCHER"
      ? [
          { value: "to-research", label: "To Research", data: toResearch },
          { value: "all-orders", label: "All Orders", data: allOrders },
        ]
      : role === "SALES"
        ? [
            {
              value: "ready-to-work",
              label: "Ready to Work",
              data: readyToWork,
            },
          ]
        : [
            { value: "to-research", label: "To Research", data: toResearch },
            {
              value: "ready-to-work",
              label: "Ready to Work",
              data: readyToWork,
            },
            { value: "all-orders", label: "All Orders", data: allOrders },
          ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-page-title font-semibold">Orders</h1>
          <p className="text-body text-muted-foreground">
            Viewing as {ROLES.find((r) => r.value === role)?.label}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {ROLES.map((r) => (
            <Link
              key={r.value}
              href={`${basePath}?role=${r.value.toLowerCase()}`}
              className={cn(
                buttonVariants({
                  variant: r.value === role ? "default" : "ghost",
                  size: "sm",
                })
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <Tabs defaultValue={tabs[0].value}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <OrdersTable data={tab.data} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
