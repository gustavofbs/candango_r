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
  description: string | null
  category_id: number | null
  unit: string
  purchase_price: number
  sale_price: number
  current_stock: number
  min_stock: number
  max_stock: number
  location: string | null
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
  address: string | null
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
  address: string | null
  city: string | null
  state: string | null
  notes: string | null
  active: boolean
  created_at: string
}

export interface ProductionCost {
  id: number
  product_id: number
  description: string
  cost_type: string
  value: number
  date: string
  notes: string | null
  created_at: string
  product?: Product
}

export interface Sale {
  id: number
  sale_number: string
  customer_id: number | null
  sale_date: string
  total_amount: number
  discount: number
  final_amount: number
  payment_method: string | null
  status: string
  notes: string | null
  created_at: string
  customer?: Customer
  items?: SaleItem[]
}

export interface SaleItem {
  id: number
  sale_id: number
  product_id: number
  quantity: number
  unit_price: number
  discount: number
  total_price: number
  product?: Product
}

export interface StockMovement {
  id: number
  product_id: number
  movement_type: string
  quantity: number
  unit_price: number | null
  total_price: number | null
  reference_type: string | null
  reference_id: number | null
  notes: string | null
  created_at: string
  product?: Product
}
