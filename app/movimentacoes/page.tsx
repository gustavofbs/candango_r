import { getSupabaseServer } from "@/lib/supabase/server"
import { MovementsContent } from "@/components/movements/movements-content"

export default async function MovementsPage() {
  const supabase = await getSupabaseServer()

  const [{ data: movements }, { data: products }] = await Promise.all([
    supabase
      .from("stock_movements")
      .select("*, product:products(name, code)")
      .order("created_at", { ascending: false }),
    supabase.from("products").select("*").eq("active", true).order("name"),
  ])

  return <MovementsContent initialMovements={movements || []} products={products || []} />
}
