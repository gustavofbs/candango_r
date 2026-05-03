import apiClient from "./client"
import type { ProductionCost, CostRefinement } from "@/lib/types"

export const costsApi = {
  getAll: async (costCategory?: 'sale' | 'production') => {
    const params = costCategory ? `?cost_category=${costCategory}` : ''
    const response = await apiClient.get<any>(`/production-costs/${params}`)
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results as ProductionCost[]
    }
    return Array.isArray(response.data) ? response.data : []
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ProductionCost>(`/production-costs/${id}/`)
    return response.data
  },

  getRefinements: async (productId?: number, includeLocked: boolean = false, costCategory?: 'sale' | 'production') => {
    const params = new URLSearchParams()
    if (productId) params.append('product', productId.toString())
    if (includeLocked) params.append('include_locked', 'true')
    if (costCategory) params.append('cost_category', costCategory)
    
    const response = await apiClient.get<CostRefinement[]>(
      `/production-costs/refinements/?${params.toString()}`
    )
    return response.data
  },

  saveProductionEntry: async (data: {
    product_id: number
    date: string
    quantity: number
    costs: { cost_type: string; value: number }[]
    notes?: string
  }) => {
    const response = await apiClient.post('/production-costs/save_production_entry/', data)
    return response.data
  },

  deleteProductionGroup: async (refinementCode: string) => {
    const response = await apiClient.post('/production-costs/delete_production_group/', { refinement_code: refinementCode })
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
