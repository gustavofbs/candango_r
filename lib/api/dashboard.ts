import apiClient from "./client"
import type { Product, Sale } from "@/lib/types"

interface DashboardData {
  totalProducts: number
  totalCustomers: number
  totalSuppliers: number
  lowStockProducts: Product[]
  recentSales: Sale[]
  monthlyResult: number
  monthlyProfit: number
  monthlyExpenses: number
  cumulativeResult: number
  selectedMonth: number
  selectedYear: number
}

export const dashboardApi = {
  getData: async (month?: number, year?: number): Promise<DashboardData> => {
    const params = new URLSearchParams()
    if (month) params.append('month', month.toString())
    if (year) params.append('year', year.toString())
    
    const url = params.toString() ? `/dashboard/?${params.toString()}` : "/dashboard/"
    const response = await apiClient.get<DashboardData>(url)
    return response.data
  },
}
