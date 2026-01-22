import { ProductsContent } from "@/components/products/products-content"
import { productsApi, categoriesApi } from "@/lib/api"

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
