import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { ReAnalyzeButton } from "./re-analyze-button"
import type { AnalyzeAction } from "@/lib/shop-types"

const idleAction: AnalyzeAction = async () => ({ status: "idle" })

const failingAction: AnalyzeAction = async () => ({
  status: "error",
  message: "Etsy rate limit reached. Wait a moment and try again.",
})

const meta: Meta<typeof ReAnalyzeButton> = {
  title: "App/ReAnalyzeButton",
  component: ReAnalyzeButton,
  tags: ["autodocs"],
  args: { shopId: 41827364 },
}
export default meta

type Story = StoryObj<typeof ReAnalyzeButton>

export const Idle: Story = {
  args: { analyzeAction: idleAction },
}

export const Failing: Story = {
  name: "Submit to see the error state",
  args: { analyzeAction: failingAction },
}
