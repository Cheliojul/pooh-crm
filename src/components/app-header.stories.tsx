import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { AppHeader } from "./app-header"

const meta: Meta<typeof AppHeader> = {
  title: "App/AppHeader",
  component: AppHeader,
  tags: ["autodocs"],
  parameters: { nextjs: { appDirectory: true } },
  argTypes: {
    active: { control: "radio", options: ["dashboard", "shop-analyzer"] },
  },
}
export default meta

type Story = StoryObj<typeof AppHeader>

export const OnDashboard: Story = {
  args: { active: "dashboard" },
}

export const OnShopAnalyzer: Story = {
  args: { active: "shop-analyzer" },
}
