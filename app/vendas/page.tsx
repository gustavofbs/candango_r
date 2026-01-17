import { getSupabaseServer } from "@/lib/supabase/server"
import { SalesContent } from "@/components/sales/sales-content"

export default async function SalesPage() {
  const supabase = await getSupabaseServer()

  const [{ data: sales }, { data: customers }, { data: products }] = await Promise.all([
    supabase.from("sales").select("*, customer:customers(name)").order("created_at", { ascending: false }),
    supabase.from("customers").select("*").eq("active", true).order("name"),
    supabase.from("products").select("*").eq("active", true).order("name"),
  ])

  return <SalesContent initialSales={sales || []} customers={customers || []} products={products || []} />
}
