import apiClient from "./client"
import type { Company } from "@/lib/types"

export const companyApi = {
  async getAll() {
    const response = await apiClient.get<any>("/company/")
    return response.data.results || response.data
  },

  async getById(id: number) {
    const response = await apiClient.get<Company>(`/company/${id}/`)
    return response.data
  },

  async create(data: Partial<Company> | FormData) {
    const response = await apiClient.post<Company>("/company/", data, {
      headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
    })
    return response.data
  },

  async update(id: number, data: Partial<Company> | FormData) {
    const response = await apiClient.put<Company>(`/company/${id}/`, data, {
      headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
    })
    return response.data
  },

  async delete(id: number) {
    await apiClient.delete(`/company/${id}/`)
  },
}
