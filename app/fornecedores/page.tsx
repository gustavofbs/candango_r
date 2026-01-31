import { SuppliersContent } from "@/components/suppliers/suppliers-content"
import { suppliersApi } from "@/lib/api"

// Desabilitar cache para sempre buscar dados frescos
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SuppliersPage() {
  try {
    const suppliers = await suppliersApi.getAll()
    return <SuppliersContent initialSuppliers={suppliers} />
  } catch (error) {
    console.error("Erro ao carregar fornecedores:", error)
    return <SuppliersContent initialSuppliers={[]} />
  }
}
