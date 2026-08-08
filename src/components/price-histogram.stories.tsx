import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { PriceHistogram } from "./price-histogram"
import { mockShopAnalysis, mockShopAnalysisDigital } from "@/lib/shop-mock-data"

const meta: Meta<typeof PriceHistogram> = {
  title: "App/PriceHistogram",
  component: PriceHistogram,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof PriceHistogram>

export const WideRange: Story = {
  args: { distribution: mockShopAnalysis.prices },
}

export const NarrowRange: Story = {
  args: { distribution: mockShopAnalysisDigital.prices },
}

export const Empty: Story = {
  args: {
    distribution: {
      partial: false,
      currencyCode: "GBP",
      buckets: [],
      min: null,
      max: null,
      mean: null,
      median: null,
      p25: null,
      p75: null,
    },
  },
}
