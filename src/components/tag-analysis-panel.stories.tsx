import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { TagAnalysisPanel } from "./tag-analysis-panel"
import { mockShopAnalysis, mockShopAnalysisDigital } from "@/lib/shop-mock-data"

const meta: Meta<typeof TagAnalysisPanel> = {
  title: "App/TagAnalysisPanel",
  component: TagAnalysisPanel,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof TagAnalysisPanel>

export const PhysicalShop: Story = {
  args: {
    analysis: mockShopAnalysis.tags,
    currencyCode: mockShopAnalysis.currencyCode,
  },
}

export const DigitalShop: Story = {
  args: {
    analysis: mockShopAnalysisDigital.tags,
    currencyCode: mockShopAnalysisDigital.currencyCode,
  },
}

export const Empty: Story = {
  args: {
    analysis: { ...mockShopAnalysis.tags, totalListings: 0, tags: [] },
    currencyCode: "GBP",
  },
}
