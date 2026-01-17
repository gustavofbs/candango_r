import apiClient from "./client"
import type { Supplier } from "@/lib/types"

export const suppliersApi = {
  getAll: async () => {
    const response = await apiClient.get<Supplier[]>("/suppliers/")
    return response.data
  },

  getById: async (id: number) => {
    const response = await apiClient.get<Supplier>(`/suppliers/${id}/`)
    return response.data
  },

  create: async (data: Partial<Supplier>) => {
    const response = await apiClient.post<Supplier>("/suppliers/", data)
    return response.data
  },

  update: async (id: number, data: Partial<Supplier>) => {
    const response = await apiClient.put<Supplier>(`/suppliers/${id}/`, data)
    return response.data
  },

  delete: async (id: number) => {
    await apiClient.delete(`/suppliers/${id}/`)
  },
}
