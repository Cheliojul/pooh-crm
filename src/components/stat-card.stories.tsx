import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { StatCard } from "./stat-card"

const meta: Meta<typeof StatCard> = {
  title: "App/StatCard",
  component: StatCard,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof StatCard>

export const Plain: Story = {
  args: { label: "Active listings", value: "142" },
}

export const WithHint: Story = {
  args: {
    label: "Lifetime sales",
    value: "8,642",
    hint: "5.8 / day since opening",
  },
}

export const Rising: Story = {
  args: {
    label: "Sales / day",
    value: "13.6",
    delta: "▲ 134% vs lifetime average",
    deltaTone: "positive",
    hint: "Over the last 7 days",
  },
}

export const Falling: Story = {
  args: {
    label: "Sales / day",
    value: "2.1",
    delta: "▼ 64% vs lifetime average",
    deltaTone: "negative",
    hint: "Over the last 9 days",
  },
}

export const Estimated: Story = {
  args: {
    label: "Est. lifetime revenue",
    value: "£677,980.11",
    caveat:
      "Estimated: Etsy exposes no per-order revenue. This is lifetime sales multiplied by the average listing price.",
    hint: "£1,064.66 / day",
  },
}

export const NotMeasurable: Story = {
  args: {
    label: "Sales / day",
    value: "—",
    hint: "Re-analyze in a few days to measure this",
  },
}
