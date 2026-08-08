import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "./button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card"

const meta: Meta<typeof Card> = {
  title: "ui/Card",
  component: Card,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>A short supporting description.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body text-muted-foreground">
          Card body content goes here.
        </p>
      </CardContent>
    </Card>
  ),
}

export const WithActionAndFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Order #ord_001</CardTitle>
        <CardDescription>Alderwood Furnishings</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-body text-muted-foreground">
          Delivery scheduled for Aug 15, 2026.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm" className="w-full">
          View order
        </Button>
      </CardFooter>
    </Card>
  ),
}
