import apiClient from "./client"
import type { Category } from "@/lib/types"

export const categoriesApi = {
  getAll: async () => {
    const response = await apiClient.get<any>("/categories/")
    // Django REST Framework retorna objeto paginado: { count, next, previous, results }
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results as Category[]
    }
    // Se não for paginado, retorna direto
    return Array.isArray(response.data) ? response.data : []
  },

  getById: async (id: number) => {
    const response = await apiClient.get<Category>(`/categories/${id}/`)
    return response.data
  },

  create: async (data: Partial<Category>) => {
    const response = await apiClient.post<Category>("/categories/", data)
    return response.data
  },

  update: async (id: number, data: Partial<Category>) => {
    const response = await apiClient.put<Category>(`/categories/${id}/`, data)
    return response.data
  },

  delete: async (id: number) => {
    await apiClient.delete(`/categories/${id}/`)
  },
}
