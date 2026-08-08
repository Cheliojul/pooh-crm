import { mockOrders } from "@/lib/mock-data"
import type { Order } from "@/lib/types"

// Mock implementations for now — each function will become a Prisma query
// (e.g. `prisma.order.findMany({ where: { status: "NEW" } })`) once the
// database is wired up. The signatures are meant to stay the same.

export async function getOrdersToResearch(): Promise<Order[]> {
  return mockOrders.filter((order) => order.status === "NEW")
}

export async function getOrdersReadyToWork(): Promise<Order[]> {
  return mockOrders.filter((order) => order.status === "CONFIRMED")
}

export async function getAllOrders(): Promise<Order[]> {
  return mockOrders
}
