import apiClient from "./client"
import type { Sale } from "@/lib/types"

export const salesApi = {
  getAll: async () => {
    const response = await apiClient.get<Sale[]>("/sales/")
    return response.data
  },

  getById: async (id: number) => {
    const response = await apiClient.get<Sale>(`/sales/${id}/`)
    return response.data
  },

  create: async (data: Partial<Sale>) => {
    const response = await apiClient.post<Sale>("/sales/", data)
    return response.data
  },

  update: async (id: number, data: Partial<Sale>) => {
    const response = await apiClient.put<Sale>(`/sales/${id}/`, data)
    return response.data
  },

  delete: async (id: number) => {
    await apiClient.delete(`/sales/${id}/`)
  },
}
