import { ExpensesContent } from "@/components/expenses/expenses-content"
import { expensesApi } from "@/lib/api"

// Desabilitar cache para sempre buscar dados frescos
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ExpensesPage() {
  let expenses = []

  try {
    expenses = await expensesApi.getAll()
  } catch (error) {
    console.error("Erro ao carregar despesas:", error)
  }

  return <ExpensesContent initialExpenses={expenses} />
}
