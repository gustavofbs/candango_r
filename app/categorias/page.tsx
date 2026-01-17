import { getSupabaseServer } from "@/lib/supabase/server"
import { CategoriesContent } from "@/components/categories/categories-content"

export default async function CategoriesPage() {
  const supabase = await getSupabaseServer()
  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return <CategoriesContent initialCategories={categories || []} />
}
