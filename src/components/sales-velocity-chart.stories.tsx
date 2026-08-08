import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { SalesVelocityChart } from "./sales-velocity-chart"
import {
  mockShopAnalysis,
  mockShopAnalysisDigital,
  mockShopAnalysisFirstRun,
} from "@/lib/shop-mock-data"
import type { ShopVelocity } from "@/lib/shop-types"

const meta: Meta<typeof SalesVelocityChart> = {
  title: "App/SalesVelocityChart",
  component: SalesVelocityChart,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof SalesVelocityChart>

export const SixCaptures: Story = {
  args: { velocity: mockShopAnalysis.velocity },
}

export const FourCaptures: Story = {
  args: { velocity: mockShopAnalysisDigital.velocity },
}

export const InsufficientSnapshots: Story = {
  name: "Empty state: only one capture",
  args: { velocity: mockShopAnalysisFirstRun.velocity },
}

const gapTooShort: ShopVelocity = {
  ...mockShopAnalysis.velocity,
  status: "gap-too-short",
  recentSalesPerDay: null,
}

export const GapTooShort: Story = {
  name: "Empty state: captures too close together",
  args: { velocity: gapTooShort },
}

const anomaly: ShopVelocity = {
  ...mockShopAnalysis.velocity,
  status: "anomaly",
  recentSalesPerDay: null,
}

export const Anomaly: Story = {
  name: "Empty state: lifetime sales went down",
  args: { velocity: anomaly },
}
