import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { OrdersTable } from "./orders-table"
import { mockOrders } from "@/lib/mock-data"

const meta: Meta<typeof OrdersTable> = {
  title: "App/OrdersTable",
  component: OrdersTable,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof OrdersTable>

export const AllOrders: Story = {
  args: { data: mockOrders },
}

export const NewOnly: Story = {
  name: "To Research (NEW only)",
  args: { data: mockOrders.filter((order) => order.status === "NEW") },
}

export const ConfirmedOnly: Story = {
  name: "Ready to Work (CONFIRMED only)",
  args: { data: mockOrders.filter((order) => order.status === "CONFIRMED") },
}

export const Empty: Story = {
  args: { data: [] },
}
