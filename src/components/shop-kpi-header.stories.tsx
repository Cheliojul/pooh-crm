import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { ShopKpiHeader } from "./shop-kpi-header"
import {
  mockShopAnalysis,
  mockShopAnalysisDigital,
  mockShopAnalysisFirstRun,
} from "@/lib/shop-mock-data"

const meta: Meta<typeof ShopKpiHeader> = {
  title: "App/ShopKpiHeader",
  component: ShopKpiHeader,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof ShopKpiHeader>

export const WithVelocity: Story = {
  args: { analysis: mockShopAnalysis },
}

export const FirstAnalysis: Story = {
  name: "First analysis (no velocity yet)",
  args: { analysis: mockShopAnalysisFirstRun },
}

export const DigitalShop: Story = {
  args: { analysis: mockShopAnalysisDigital },
}
