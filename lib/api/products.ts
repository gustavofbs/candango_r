import apiClient from "./client"
import type { Product } from "@/lib/types"

export const productsApi = {
  getAll: async () => {
    const response = await apiClient.get<any>("/products/")
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results as Product[]
    }
    return Array.isArray(response.data) ? response.data : []
  },

  getById: async (id: number) => {
    const response = await apiClient.get<Product>(`/products/${id}/`)
    return response.data
  },

  create: async (data: Partial<Product>) => {
    const response = await apiClient.post<Product>("/products/", data)
    return response.data
  },

  update: async (id: number, data: Partial<Product>) => {
    const response = await apiClient.put<Product>(`/products/${id}/`, data)
    return response.data
  },

  delete: async (id: number) => {
    await apiClient.delete(`/products/${id}/`)
  },
}
