import { getSupabaseServer } from "@/lib/supabase/server"
import { ProductsContent } from "@/components/products/products-content"

export default async function ProductsPage() {
  const supabase = await getSupabaseServer()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*, category:categories(name)").order("name"),
    supabase.from("categories").select("*").order("name"),
  ])

  return <ProductsContent initialProducts={products || []} categories={categories || []} />
}
