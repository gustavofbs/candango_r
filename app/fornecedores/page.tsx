import { SuppliersContent } from "@/components/suppliers/suppliers-content"
import { suppliersApi } from "@/lib/api"

export default async function SuppliersPage() {
  try {
    const suppliers = await suppliersApi.getAll()
    return <SuppliersContent initialSuppliers={suppliers} />
  } catch (error) {
    console.error("Erro ao carregar fornecedores:", error)
    return <SuppliersContent initialSuppliers={[]} />
  }
}
