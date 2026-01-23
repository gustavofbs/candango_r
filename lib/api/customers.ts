import apiClient from "./client"
import type { Customer } from "@/lib/types"

export const customersApi = {
  getAll: async () => {
    const response = await apiClient.get<any>("/customers/")
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results as Customer[]
    }
    return Array.isArray(response.data) ? response.data : []
  },

  getById: async (id: number) => {
    const response = await apiClient.get<Customer>(`/customers/${id}/`)
    return response.data
  },

  create: async (data: Partial<Customer>) => {
    const response = await apiClient.post<Customer>("/customers/", data)
    return response.data
  },

  update: async (id: number, data: Partial<Customer>) => {
    const response = await apiClient.put<Customer>(`/customers/${id}/`, data)
    return response.data
  },

  delete: async (id: number) => {
    await apiClient.delete(`/customers/${id}/`)
  },
}
