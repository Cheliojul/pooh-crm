import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { ShopSearchForm } from "./shop-search-form"
import type { AnalyzeAction } from "@/lib/shop-types"

// The real action is passed in from the page. Importing it here would drag
// `node:fs` into Storybook's browser bundle, which is exactly why the component
// takes it as a prop.
const idleAction: AnalyzeAction = async () => ({ status: "idle" })

const failingAction: AnalyzeAction = async () => ({
  status: "error",
  message: "No Etsy shop matched that name or URL.",
})

const slowAction: AnalyzeAction = async () => {
  await new Promise((resolve) => setTimeout(resolve, 30_000))
  return { status: "idle" }
}

const meta: Meta<typeof ShopSearchForm> = {
  title: "App/ShopSearchForm",
  component: ShopSearchForm,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof ShopSearchForm>

export const Idle: Story = {
  args: { analyzeAction: idleAction },
}

export const Failing: Story = {
  name: "Submit to see the error state",
  args: { analyzeAction: failingAction },
}

export const Pending: Story = {
  name: "Submit to see the pending state",
  args: { analyzeAction: slowAction },
}
