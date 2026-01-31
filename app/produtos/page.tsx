import { ProductsContent } from "@/components/products/products-content"
import { productsApi, categoriesApi } from "@/lib/api"

// Desabilitar cache para sempre buscar dados frescos
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProductsPage() {
  try {
    const [products, categories] = await Promise.all([
      productsApi.getAll(),
      categoriesApi.getAll(),
    ])

    return <ProductsContent initialProducts={products} categories={categories} />
  } catch (error) {
    console.error("Erro ao carregar produtos:", error)
    return <ProductsContent initialProducts={[]} categories={[]} />
  }
}
