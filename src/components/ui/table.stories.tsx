import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

const meta: Meta<typeof Table> = {
  title: "ui/Table",
  component: Table,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof Table>

const rows = [
  { client: "Alderwood Furnishings", price: "$4,200.00", status: "New" },
  { client: "Blue Harbor Logistics", price: "$1,875.00", status: "Confirmed" },
  { client: "Cedar & Finch", price: "$9,600.00", status: "Scheduled" },
]

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>Recent orders.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.client}>
            <TableCell>{row.client}</TableCell>
            <TableCell>{row.price}</TableCell>
            <TableCell>{row.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}
