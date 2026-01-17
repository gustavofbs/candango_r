import apiClient from "./client"
import type { Product, StockMovement, Sale } from "@/lib/types"

interface DashboardData {
  totalProducts: number
  totalCustomers: number
  totalSuppliers: number
  lowStockProducts: Product[]
  recentMovements: (StockMovement & { product: { name: string } | null })[]
  recentSales: (Sale & { customer: { name: string } | null })[]
}

export const dashboardApi = {
  getData: async (): Promise<DashboardData> => {
    const response = await apiClient.get<DashboardData>("/dashboard/")
    return response.data
  },
}
