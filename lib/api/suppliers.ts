import apiClient from "./client"
import type { Supplier } from "@/lib/types"

export const suppliersApi = {
  getAll: async () => {
    const response = await apiClient.get<any>("/suppliers/")
    console.log("suppliersApi.getAll - response.data:", response.data)
    console.log("suppliersApi.getAll - tem results?", 'results' in response.data)
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      console.log("suppliersApi.getAll - retornando results:", response.data.results)
      return response.data.results as Supplier[]
    }
    console.log("suppliersApi.getAll - retornando array direto ou vazio")
    return Array.isArray(response.data) ? response.data : []
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
