import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

const meta: Meta<typeof Tabs> = {
  title: "ui/Tabs",
  component: Tabs,
  tags: ["autodocs"],
}
export default meta

type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-96">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="mt-4 text-body">
        Make changes to your account here.
      </TabsContent>
      <TabsContent value="password" className="mt-4 text-body">
        Change your password here.
      </TabsContent>
    </Tabs>
  ),
}

export const ThreeTabs: Story = {
  render: () => (
    <Tabs defaultValue="to-research" className="w-96">
      <TabsList>
        <TabsTrigger value="to-research">To Research</TabsTrigger>
        <TabsTrigger value="ready-to-work">Ready to Work</TabsTrigger>
        <TabsTrigger value="all-orders">All Orders</TabsTrigger>
      </TabsList>
      <TabsContent value="to-research" className="mt-4 text-body">
        NEW-status orders.
      </TabsContent>
      <TabsContent value="ready-to-work" className="mt-4 text-body">
        CONFIRMED-status orders.
      </TabsContent>
      <TabsContent value="all-orders" className="mt-4 text-body">
        All orders, regardless of status.
      </TabsContent>
    </Tabs>
  ),
}
