import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { BarSeries } from "./bar-series"

const meta: Meta<typeof BarSeries> = {
  title: "App/BarSeries",
  component: BarSeries,
  tags: ["autodocs"],
  args: {
    caption: "Listings per bucket",
    categoryLabel: "Bucket",
    valueLabel: "Listings",
  },
}
export default meta

type Story = StoryObj<typeof BarSeries>

export const Short: Story = {
  args: {
    data: [12, 30, 24, 8, 41, 17].map((value, index) => ({
      key: String(index),
      label: `£${index * 20}`,
      value,
      title: `£${index * 20}–£${(index + 1) * 20}: ${value} listings`,
    })),
  },
}

export const Long: Story = {
  name: "36 buckets (labels thin automatically)",
  args: {
    data: Array.from({ length: 36 }, (_, index) => ({
      key: String(index),
      label: `M${index + 1}`,
      value: Math.round(10 + 9 * Math.sin(index / 3) + (index % 5)),
      title: `Month ${index + 1}`,
    })),
  },
}

export const WithZeroBuckets: Story = {
  args: {
    data: [5, 0, 0, 12, 3, 0, 9].map((value, index) => ({
      key: String(index),
      label: `M${index + 1}`,
      value,
      title: `Month ${index + 1}: ${value}`,
    })),
  },
}

export const Empty: Story = {
  args: { data: [] },
}
