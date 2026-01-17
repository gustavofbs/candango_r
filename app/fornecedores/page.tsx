import { getSupabaseServer } from "@/lib/supabase/server"
import { SuppliersContent } from "@/components/suppliers/suppliers-content"

export default async function SuppliersPage() {
  const supabase = await getSupabaseServer()
  const { data: suppliers } = await supabase.from("suppliers").select("*").order("name")

  return <SuppliersContent initialSuppliers={suppliers || []} />
}
