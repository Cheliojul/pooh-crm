import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { LoginForm } from "./login-form"

const meta: Meta<typeof LoginForm> = {
  title: "App/LoginForm",
  component: LoginForm,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex min-h-[24rem] w-full items-center justify-center bg-muted/30 p-6">
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof LoginForm>

export const Default: Story = {}
