import { getSupabaseServer } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const supabase = await getSupabaseServer()

  const [
    { count: totalProducts },
    { count: totalCustomers },
    { count: totalSuppliers },
    { data: lowStockProducts },
    { data: recentMovements },
    { data: recentSales },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("suppliers").select("*", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("*")
      .lt("current_stock", supabase.rpc ? 10 : 10)
      .limit(10),
    supabase
      .from("stock_movements")
      .select("*, product:products(name)")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("sales").select("*, customer:customers(name)").order("created_at", { ascending: false }).limit(5),
  ])

  return (
    <DashboardContent
      totalProducts={totalProducts || 0}
      totalCustomers={totalCustomers || 0}
      totalSuppliers={totalSuppliers || 0}
      lowStockProducts={lowStockProducts || []}
      recentMovements={recentMovements || []}
      recentSales={recentSales || []}
    />
  )
}
