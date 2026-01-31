import { SalesContent } from "@/components/sales/sales-content"
import { salesApi, customersApi, productsApi } from "@/lib/api"
import type { Customer, Product } from "@/lib/types"

// Desabilitar cache para sempre buscar dados frescos
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SalesPage() {
  try {
    const [sales, customers, products] = await Promise.all([
      salesApi.getAll(),
      customersApi.getAll(),
      productsApi.getAll(),
    ])

    const activeCustomers = customers.filter((c: Customer) => c.active)
    const activeProducts = products.filter((p: Product) => p.active)

    return <SalesContent initialSales={sales} customers={activeCustomers} products={activeProducts} />
  } catch (error) {
    console.error("Erro ao carregar vendas:", error)
    return <SalesContent initialSales={[]} customers={[]} products={[]} />
  }
}
