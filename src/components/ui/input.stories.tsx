import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Input } from "./input"

const meta: Meta<typeof Input> = {
  title: "ui/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: { control: "select", options: ["text", "email", "password", "number"] },
    disabled: { control: "boolean" },
  },
  args: {
    placeholder: "you@company.com",
  },
}
export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = {}

export const WithValue: Story = {
  args: {
    defaultValue: "jane@example.com",
  },
}

export const Password: Story = {
  args: {
    type: "password",
    defaultValue: "hunter2",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Can't touch this",
  },
}

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "not-an-email",
  },
}
