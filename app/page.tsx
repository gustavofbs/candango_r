import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { dashboardApi } from "@/lib/api"

export default async function DashboardPage() {
  try {
    const data = await dashboardApi.getData()

    return (
      <DashboardContent
        totalProducts={data.totalProducts}
        totalCustomers={data.totalCustomers}
        totalSuppliers={data.totalSuppliers}
        lowStockProducts={data.lowStockProducts}
        recentMovements={data.recentMovements}
        recentSales={data.recentSales}
      />
    )
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error)
    return (
      <DashboardContent
        totalProducts={0}
        totalCustomers={0}
        totalSuppliers={0}
        lowStockProducts={[]}
        recentMovements={[]}
        recentSales={[]}
      />
    )
  }
}
