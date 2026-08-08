import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { ShopAnalysisTabs } from "./shop-analysis-tabs"
import {
  mockShopAnalysis,
  mockShopAnalysisDigital,
  mockShopAnalysisPartial,
} from "@/lib/shop-mock-data"

// Relative dates come from `analysis.generatedAt`, which the mock data pins to
// FIXTURE_NOW_MS — so these stories are stable without any extra wiring.
const meta: Meta<typeof ShopAnalysisTabs> = {
  title: "App/ShopAnalysisTabs",
  component: ShopAnalysisTabs,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof ShopAnalysisTabs>

export const PhysicalShop: Story = {
  args: { analysis: mockShopAnalysis },
}

export const DigitalShop: Story = {
  args: { analysis: mockShopAnalysisDigital },
}

export const PartialCapture: Story = {
  name: "Partial capture (deltas suppressed)",
  args: { analysis: mockShopAnalysisPartial },
}
