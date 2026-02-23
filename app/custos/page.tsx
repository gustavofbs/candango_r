import { CostsContent } from "@/components/costs/costs-content"
import { costsApi, productsApi, customersApi } from "@/lib/api"
import type { Product, Customer } from "@/lib/types"

// Desabilitar cache para sempre buscar dados frescos
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CostsPage() {
  try {
    const [costs, products, customers] = await Promise.all([
      costsApi.getAll(),
      productsApi.getAll(),
      customersApi.getAll(),
    ])

    const activeProducts = products.filter((p: Product) => p.active)
    const activeCustomers = customers.filter((c: Customer) => c.active)

    return <CostsContent initialCosts={costs} products={activeProducts} customers={activeCustomers} />
  } catch (error) {
    console.error("Erro ao carregar custos:", error)
    return <CostsContent initialCosts={[]} products={[]} customers={[]} />
  }
}
