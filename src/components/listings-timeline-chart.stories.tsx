import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { ListingsTimelineChart } from "./listings-timeline-chart"
import { mockShopAnalysis, mockShopAnalysisDigital } from "@/lib/shop-mock-data"

const meta: Meta<typeof ListingsTimelineChart> = {
  title: "App/ListingsTimelineChart",
  component: ListingsTimelineChart,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof ListingsTimelineChart>

export const ThreeYearShop: Story = {
  name: "Long history (capped at 36 months)",
  args: { timeline: mockShopAnalysis.timeline },
}

export const YoungShop: Story = {
  args: { timeline: mockShopAnalysisDigital.timeline },
}

export const Empty: Story = {
  args: { timeline: { partial: false, buckets: [], busiestMonth: null } },
}
