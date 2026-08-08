import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { KeywordGapPanel } from "./keyword-gap-panel"
import { mockShopAnalysis, mockShopAnalysisDigital } from "@/lib/shop-mock-data"

const meta: Meta<typeof KeywordGapPanel> = {
  title: "App/KeywordGapPanel",
  component: KeywordGapPanel,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof KeywordGapPanel>

export const WithGaps: Story = {
  args: { analysis: mockShopAnalysis.keywords },
}

export const DigitalShop: Story = {
  args: { analysis: mockShopAnalysisDigital.keywords },
}

export const NoGaps: Story = {
  name: "Every frequent keyword is already tagged",
  args: { analysis: { ...mockShopAnalysis.keywords, tagGaps: [] } },
}
