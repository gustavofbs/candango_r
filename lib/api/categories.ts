import apiClient from "./client"
import type { Category } from "@/lib/types"

export const categoriesApi = {
  getAll: async () => {
    const response = await apiClient.get<Category[]>("/categories/")
    return response.data
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
