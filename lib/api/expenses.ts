import apiClient from "./client"
import type { Expense } from "@/lib/types"

export const expensesApi = {
  async getAll() {
    const response = await apiClient.get<any>("/expenses/")
    // Django REST Framework retorna objeto paginado: {count, next, previous, results}
    return response.data.results || response.data
  },

  async getById(id: number) {
    const response = await apiClient.get<Expense>(`/expenses/${id}/`)
    return response.data
  },

  async create(data: Partial<Expense>) {
    const response = await apiClient.post<Expense>("/expenses/", data)
    return response.data
  },

  async update(id: number, data: Partial<Expense>) {
    const response = await apiClient.put<Expense>(`/expenses/${id}/`, data)
    return response.data
  },

  async delete(id: number) {
    await apiClient.delete(`/expenses/${id}/`)
  },
}
