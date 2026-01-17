import apiClient from "./client"
import type { StockMovement } from "@/lib/types"

export const movementsApi = {
  getAll: async () => {
    const response = await apiClient.get<StockMovement[]>("/stock-movements/")
    return response.data
  },

  getById: async (id: number) => {
    const response = await apiClient.get<StockMovement>(`/stock-movements/${id}/`)
    return response.data
  },

  create: async (data: Partial<StockMovement>) => {
    const response = await apiClient.post<StockMovement>("/stock-movements/", data)
    return response.data
  },

  update: async (id: number, data: Partial<StockMovement>) => {
    const response = await apiClient.put<StockMovement>(`/stock-movements/${id}/`, data)
    return response.data
  },

  delete: async (id: number) => {
    await apiClient.delete(`/stock-movements/${id}/`)
  },
}
