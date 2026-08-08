import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Input } from "./input"
import { Label } from "./label"

const meta: Meta<typeof Label> = {
  title: "ui/Label",
  component: Label,
  tags: ["autodocs"],
  args: {
    children: "Email",
  },
}
export default meta

type Story = StoryObj<typeof Label>

export const Default: Story = {}

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="story-email">Email</Label>
      <Input id="story-email" type="email" placeholder="you@company.com" />
    </div>
  ),
}
