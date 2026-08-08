import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { OrderStatusBadge } from "./order-status-badge"
import type { OrderStatus } from "@/lib/types"

const meta: Meta<typeof OrderStatusBadge> = {
  title: "App/OrderStatusBadge",
  component: OrderStatusBadge,
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["NEW", "CONFIRMED", "SCHEDULED", "DELIVERED", "CANCELLED"] satisfies OrderStatus[],
    },
  },
}
export default meta

type Story = StoryObj<typeof OrderStatusBadge>

export const New: Story = { args: { status: "NEW" } }
export const Confirmed: Story = { args: { status: "CONFIRMED" } }
export const Scheduled: Story = { args: { status: "SCHEDULED" } }
export const Delivered: Story = { args: { status: "DELIVERED" } }
export const Cancelled: Story = { args: { status: "CANCELLED" } }

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <OrderStatusBadge status="NEW" />
      <OrderStatusBadge status="CONFIRMED" />
      <OrderStatusBadge status="SCHEDULED" />
      <OrderStatusBadge status="DELIVERED" />
      <OrderStatusBadge status="CANCELLED" />
    </div>
  ),
}
