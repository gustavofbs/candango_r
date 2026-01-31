import { CustomersContent } from "@/components/customers/customers-content"
import { customersApi } from "@/lib/api"

// Desabilitar cache para sempre buscar dados frescos
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CustomersPage() {
  try {
    const customers = await customersApi.getAll()
    return <CustomersContent initialCustomers={customers} />
  } catch (error) {
    console.error("Erro ao carregar clientes:", error)
    return <CustomersContent initialCustomers={[]} />
  }
}
