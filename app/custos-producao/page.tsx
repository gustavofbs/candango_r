import { ProductionInputContent } from "@/components/costs/production-input-content"
import { costsApi, productsApi } from "@/lib/api"
import type { Product } from "@/lib/types"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProductionCostsPage() {
  try {
    const [groups, products] = await Promise.all([
      costsApi.getRefinements(undefined, true, "production"),
      productsApi.getAll(),
    ])

    const activeProducts = products.filter((p: Product) => p.active)

    return <ProductionInputContent initialGroups={groups as any} products={activeProducts} />
  } catch (error) {
    console.error("Erro ao carregar custos de produção:", error)
    return <ProductionInputContent initialGroups={[]} products={[]} />
  }
}
