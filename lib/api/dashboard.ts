import apiClient from "./client"
import type { Product, Sale } from "@/lib/types"

interface DashboardData {
  totalProducts: number
  totalCustomers: number
  totalSuppliers: number
  lowStockProducts: Product[]
  recentSales: (Sale & { customer: { name: string } | null })[]
  monthlyResult: number
}

export const dashboardApi = {
  getData: async (): Promise<DashboardData> => {
    const response = await apiClient.get<DashboardData>("/dashboard/")
    return response.data
  },
}
