import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Separator } from "./separator"

const meta: Meta<typeof Separator> = {
  title: "ui/Separator",
  component: Separator,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof Separator>

export const Horizontal: Story = {
  render: () => (
    <div className="w-72">
      <p className="text-body">Above the separator</p>
      <Separator className="my-4" />
      <p className="text-body">Below the separator</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-12 items-center gap-4">
      <span className="text-body">Left</span>
      <Separator orientation="vertical" />
      <span className="text-body">Right</span>
    </div>
  ),
}
