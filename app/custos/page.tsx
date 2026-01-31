import { CostsContent } from "@/components/costs/costs-content"
import { costsApi, productsApi } from "@/lib/api"
import type { Product } from "@/lib/types"

// Desabilitar cache para sempre buscar dados frescos
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CostsPage() {
  try {
    const [costs, products] = await Promise.all([
      costsApi.getAll(),
      productsApi.getAll(),
    ])

    const activeProducts = products.filter((p: Product) => p.active)

    return <CostsContent initialCosts={costs} products={activeProducts} />
  } catch (error) {
    console.error("Erro ao carregar custos:", error)
    return <CostsContent initialCosts={[]} products={[]} />
  }
}
