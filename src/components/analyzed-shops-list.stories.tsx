import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { AnalyzedShopsList } from "./analyzed-shops-list"
import { FIXTURE_NOW_MS, mockShopIndex } from "@/lib/shop-mock-data"

const meta: Meta<typeof AnalyzedShopsList> = {
  title: "App/AnalyzedShopsList",
  component: AnalyzedShopsList,
  tags: ["autodocs"],
  args: { now: FIXTURE_NOW_MS },
  parameters: { nextjs: { appDirectory: true } },
}
export default meta

type Story = StoryObj<typeof AnalyzedShopsList>

export const TwoShops: Story = {
  args: { shops: mockShopIndex },
}

export const AwaitingSecondCapture: Story = {
  name: "Analyzed once — velocity not measurable yet",
  args: {
    shops: mockShopIndex.map((shop) => ({
      ...shop,
      snapshotCount: 1,
      recentSalesPerDay: null,
    })),
  },
}

export const PartialCapture: Story = {
  args: {
    shops: mockShopIndex.map((shop, index) => ({
      ...shop,
      lastCapturePartial: index === 0,
      isVacation: index === 1,
    })),
  },
}

export const Empty: Story = {
  args: { shops: [] },
}
