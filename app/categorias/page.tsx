import { CategoriesContent } from "@/components/categories/categories-content"
import { categoriesApi } from "@/lib/api"

export default async function CategoriesPage() {
  try {
    const categories = await categoriesApi.getAll()
    return <CategoriesContent initialCategories={categories} />
  } catch (error) {
    console.error("Erro ao carregar categorias:", error)
    return <CategoriesContent initialCategories={[]} />
  }
}
