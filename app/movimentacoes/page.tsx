import { MovementsContent } from "@/components/movements/movements-content"
import { movementsApi, productsApi } from "@/lib/api"
import type { Product } from "@/lib/types"

export default async function MovementsPage() {
  try {
    const [movements, products] = await Promise.all([
      movementsApi.getAll(),
      productsApi.getAll(),
    ])

    const activeProducts = products.filter((p: Product) => p.active)

    return <MovementsContent initialMovements={movements} products={activeProducts} />
  } catch (error) {
    console.error("Erro ao carregar movimentações:", error)
    return <MovementsContent initialMovements={[]} products={[]} />
  }
}
