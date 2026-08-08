export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "SCHEDULED"
  | "DELIVERED"
  | "CANCELLED"

export type Role = "RESEARCHER" | "SALES" | "ADMIN"

export interface Client {
  id: string
  name: string
}

export interface Order {
  id: string
  client: Client
  price: number
  estimatedPrice: number
  agreedPrice: number | null
  deliveryDate: string
  status: OrderStatus
  updatedAt: string
}
