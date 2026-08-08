import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { DashboardTabs } from "./dashboard-tabs"
import {
  getAllOrders,
  getOrdersReadyToWork,
  getOrdersToResearch,
} from "@/lib/data/orders"

const meta: Meta<typeof DashboardTabs> = {
  title: "App/DashboardTabs",
  component: DashboardTabs,
  tags: ["autodocs"],
  parameters: {
    nextjs: { appDirectory: true },
  },
}
export default meta

type Story = StoryObj<typeof DashboardTabs>

// Reuses the same mock data-fetching functions the real dashboard page
// awaits — once those are backed by Prisma, these stories pick it up too.
const loadOrderData = async () => {
  const [toResearch, readyToWork, allOrders] = await Promise.all([
    getOrdersToResearch(),
    getOrdersReadyToWork(),
    getAllOrders(),
  ])
  return { toResearch, readyToWork, allOrders }
}

function asOrderData(loaded: Record<string, unknown>) {
  return loaded as Awaited<ReturnType<typeof loadOrderData>>
}

export const Researcher: Story = {
  name: "Researcher (To Research + All Orders)",
  loaders: [loadOrderData],
  render: (_args, { loaded }) => (
    <DashboardTabs role="RESEARCHER" {...asOrderData(loaded)} />
  ),
}

export const Sales: Story = {
  name: "Sales (Ready to Work)",
  loaders: [loadOrderData],
  render: (_args, { loaded }) => (
    <DashboardTabs role="SALES" {...asOrderData(loaded)} />
  ),
}

export const Admin: Story = {
  name: "Admin (all tabs)",
  loaders: [loadOrderData],
  render: (_args, { loaded }) => (
    <DashboardTabs role="ADMIN" {...asOrderData(loaded)} />
  ),
}
