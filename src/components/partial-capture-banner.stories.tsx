import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { PartialCaptureBanner } from "./partial-capture-banner"
import { mockShopAnalysisPartial } from "@/lib/shop-mock-data"

const meta: Meta<typeof PartialCaptureBanner> = {
  title: "App/PartialCaptureBanner",
  component: PartialCaptureBanner,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof PartialCaptureBanner>

export const WithErrors: Story = {
  args: {
    fetchedListingCount: mockShopAnalysisPartial.fetchedListingCount,
    expectedListingCount: mockShopAnalysisPartial.expectedListingCount,
    errors: mockShopAnalysisPartial.errors,
  },
}

export const WithoutErrors: Story = {
  args: {
    fetchedListingCount: 340,
    expectedListingCount: 512,
    errors: [],
  },
}
