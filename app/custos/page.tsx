import { getSupabaseServer } from "@/lib/supabase/server"
import { CostsContent } from "@/components/costs/costs-content"

export default async function CostsPage() {
  const supabase = await getSupabaseServer()

  const [{ data: costs }, { data: products }] = await Promise.all([
    supabase.from("production_costs").select("*, product:products(name, code)").order("date", { ascending: false }),
    supabase.from("products").select("*").eq("active", true).order("name"),
  ])

  return <CostsContent initialCosts={costs || []} products={products || []} />
}
