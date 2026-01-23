import apiClient from "./client"
import type { ProductionCost, CostRefinement } from "@/lib/types"

export const costsApi = {
  getAll: async () => {
    const response = await apiClient.get<any>("/production-costs/")
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results as ProductionCost[]
    }
    return Array.isArray(response.data) ? response.data : []
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ProductionCost>(`/production-costs/${id}/`)
    return response.data
  },

  getRefinements: async (productId?: number, includeLocked: boolean = false) => {
    const params = new URLSearchParams()
    if (productId) params.append('product', productId.toString())
    if (includeLocked) params.append('include_locked', 'true')
    
    const response = await apiClient.get<CostRefinement[]>(
      `/production-costs/refinements/?${params.toString()}`
    )
    return response.data
  },

  create: async (data: Partial<ProductionCost>) => {
    const response = await apiClient.post<ProductionCost>("/production-costs/", data)
    return response.data
  },

  update: async (id: number, data: Partial<ProductionCost>) => {
    const response = await apiClient.put<ProductionCost>(`/production-costs/${id}/`, data)
    return response.data
  },

  delete: async (id: number) => {
    await apiClient.delete(`/production-costs/${id}/`)
  },
}
