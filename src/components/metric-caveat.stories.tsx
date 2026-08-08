import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { MetricCaveat } from "./metric-caveat"

const meta: Meta<typeof MetricCaveat> = {
  title: "App/MetricCaveat",
  component: MetricCaveat,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <span className="font-heading text-page-title font-semibold">
        £677,980.11
        <Story />
      </span>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof MetricCaveat>

export const Estimate: Story = {
  args: {
    explanation:
      "Estimated: Etsy exposes no per-order revenue. This is lifetime sales multiplied by the average listing price, so it is unreliable for shops with a wide price spread.",
  },
}

export const Question: Story = {
  args: {
    marker: "?",
    explanation:
      "Stock decrease since the previous capture. Sellers restock, so this is a floor on units sold, never a count.",
  },
}
