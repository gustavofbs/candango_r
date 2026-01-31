import { CategoriesContent } from "@/components/categories/categories-content"
import { categoriesApi } from "@/lib/api"

// Desabilitar cache para sempre buscar dados frescos
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CategoriesPage() {
  try {
    const categories = await categoriesApi.getAll()
    return <CategoriesContent initialCategories={categories} />
  } catch (error) {
    console.error("Erro ao carregar categorias:", error)
    return <CategoriesContent initialCategories={[]} />
  }
}
