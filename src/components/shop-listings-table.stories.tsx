import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { ShopListingsTable } from "./shop-listings-table"
import {
  FIXTURE_NOW_MS,
  mockShopAnalysis,
  mockShopAnalysisFirstRun,
} from "@/lib/shop-mock-data"

const meta: Meta<typeof ShopListingsTable> = {
  title: "App/ShopListingsTable",
  component: ShopListingsTable,
  tags: ["autodocs"],
  // Pinned so "days live" and "updated" do not drift between runs.
  args: { now: FIXTURE_NOW_MS },
}
export default meta

type Story = StoryObj<typeof ShopListingsTable>

export const WithDeltas: Story = {
  args: {
    listings: mockShopAnalysis.listings,
    currencyCode: mockShopAnalysis.currencyCode,
  },
}

export const WithoutDeltas: Story = {
  name: "First analysis (no previous capture)",
  args: {
    listings: mockShopAnalysisFirstRun.listings,
    currencyCode: mockShopAnalysisFirstRun.currencyCode,
  },
}

export const Empty: Story = {
  args: { listings: [], currencyCode: "GBP" },
}
