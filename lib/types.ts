export interface Category {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface Product {
  id: number
  code: string
  name: string
  composition: string | null
  size: string | null
  category_id: number | null
  category_name?: string
  unit: string
  purchase_price: number
  current_stock: number
  min_stock: number
  max_stock: number
  location: string | null
  supplier_name?: string | null
  active: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface Customer {
  id: number
  code: string
  name: string
  document: string | null
  email: string | null
  phone: string | null
  zipcode: string | null
  address: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  notes: string | null
  active: boolean
  created_at: string
}

export interface Supplier {
  id: number
  code: string
  name: string
  document: string | null
  contact_name: string | null
  email: string | null
  phone: string | null
  zipcode: string | null
  address: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  notes: string | null
  active: boolean
  created_at: string
}

export interface Expense {
  id: number
  name: string
  amount: number
  expense_type: 'FIXO' | 'VARIAVEL'
  date: string
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface ProductionCost {
  id: number
  product: number
  product_name?: string
  product_code?: string
  customer?: number | null
  customer_name?: string | null
  description: string
  cost_type: string
  cost_type_display?: string
  value: number
  date: string
  notes: string | null
  refinement_code?: string | null
  refinement_name?: string | null
  is_locked: boolean
  locked_by_sale?: number | null
  locked_by_sale_number?: string | null
  locked_by_sale_customer?: string | null
  locked_at?: string | null
  created_at: string
}

export interface CostRefinement {
  refinement_code: string
  refinement_name: string
  product_id: number
  product_name: string
  product_code: string
  is_locked: boolean
  locked_by_sale_number?: string | null
  locked_at?: string | null
  costs: {
    id: number
    cost_type: string
    cost_type_display: string
    value: number
    description: string
  }[]
  total: number
}

export interface Sale {
  id: number
  sale_number: string
  sale_type: string
  customer: number | null
  customer_name?: string | null
  customer_state?: string | null
  sale_date: string
  total_amount: number
  discount: number
  final_amount: number
  payment_method: string | null
  nf?: string | null
  tax_percentage: number
  status: string
  notes: string | null
  created_at: string
  items?: SaleItem[]
}

export interface SaleItem {
  id: number
  sale_id?: number
  product: number
  product_name?: string
  product_code?: string
  quantity: number
  unit_price: number
  unit_cost: number
  cost_refinement_code?: string | null
  cost_snapshot?: any
  cost_calculated_at?: string | null
  discount: number
  tax: number
  freight: number
  total_price: number
  total_cost: number
  profit: number
}

export interface StockMovement {
  id: number
  product: number
  product_name?: string
  product_code?: string
  movement_type: string
  quantity: number
  unit_price: number | null
  total_price: number | null
  reference_type: string | null
  reference_id: number | null
  notes: string | null
  created_at: string
}

export interface Company {
  id: number
  razao_social: string
  nome_fantasia: string | null
  cnpj: string
  inscricao_estadual: string | null
  cep: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  phone: string
  email: string
  website: string | null
  responsavel: string
  logo: string | null
  logo_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}
