import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { DeleteShopButton } from "./delete-shop-button"

const meta: Meta<typeof DeleteShopButton> = {
  title: "App/DeleteShopButton",
  component: DeleteShopButton,
  tags: ["autodocs"],
  args: {
    shopId: 41827364,
    shopName: "CozyKnitsCo",
    deleteAction: async () => {},
  },
}
export default meta

type Story = StoryObj<typeof DeleteShopButton>

export const Default: Story = {
  name: "Clicking prompts for confirmation first",
}
