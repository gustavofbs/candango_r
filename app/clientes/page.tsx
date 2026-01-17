import { getSupabaseServer } from "@/lib/supabase/server"
import { CustomersContent } from "@/components/customers/customers-content"

export default async function CustomersPage() {
  const supabase = await getSupabaseServer()
  const { data: customers } = await supabase.from("customers").select("*").order("name")

  return <CustomersContent initialCustomers={customers || []} />
}
