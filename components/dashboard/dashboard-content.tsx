"use client"

import { useState, useEffect } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { StatusBadge } from "@/components/erp/status-badge"
import type { Product, Sale } from "@/lib/types"
import { dashboardApi } from "@/lib/api"

interface DashboardData {
  totalProducts: number
  totalCustomers: number
  totalSuppliers: number
  lowStockProducts: Product[]
  recentSales: Sale[]
  monthlyResult: number
  monthlyProfit: number
  monthlyExpenses: number
  cumulativeResult: number
  selectedMonth: number
  selectedYear: number
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await dashboardApi.getData(selectedMonth, selectedYear)
      setData(result)
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth, selectedYear])

  if (loading || !data) {
    return (
      <div className="space-y-2">
        <ErpWindow title="Dashboard - Visão Geral">
          <div className="p-4 text-center">Carregando...</div>
        </ErpWindow>
      </div>
    )
  }

  const { totalProducts, totalCustomers, totalSuppliers, lowStockProducts, recentSales, monthlyResult, monthlyProfit, monthlyExpenses, cumulativeResult } = data
  return (
    <div className="space-y-2">
      <ErpWindow title="Dashboard - Visão Geral">
        <div className="grid grid-cols-5 gap-2 mb-4">
          <div className="erp-inset p-3 text-center">
            <div className="text-2xl font-bold text-[#000080]">{totalProducts}</div>
            <div className="text-[11px]">Produtos Cadastrados</div>
          </div>
          <div className="erp-inset p-3 text-center">
            <div className="text-2xl font-bold text-[#008000]">{totalCustomers}</div>
            <div className="text-[11px]">Clientes Ativos</div>
          </div>
          <div className="erp-inset p-3 text-center">
            <div className="text-2xl font-bold text-[#800080]">{totalSuppliers}</div>
            <div className="text-[11px]">Fornecedores</div>
          </div>
          <div className="erp-inset p-3 text-center">
            <div
              className={`text-2xl font-bold ${
                cumulativeResult >= 0 ? "text-[#008000]" : "text-[#FF0000]"
              }`}
            >
              R$ {formatCurrency(cumulativeResult)}
            </div>
            <div className="text-[11px]">Resultado Acumulado</div>
          </div>
          <div className="erp-inset p-3 text-center">
            <div
              className={`text-2xl font-bold ${
                monthlyResult >= 0 ? "text-[#008000]" : "text-[#FF0000]"
              }`}
            >
              R$ {formatCurrency(monthlyResult)}
            </div>
            <div className="text-[11px]">Resultado Mensal</div>
            <div className="text-[9px] text-gray-600 mt-1">
              Lucro: R$ {formatCurrency(monthlyProfit)} - Despesas: R$ {formatCurrency(monthlyExpenses)}
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <label className="text-[11px] font-bold">Período:</label>
          <select
            className="erp-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            <option value={1}>Janeiro</option>
            <option value={2}>Fevereiro</option>
            <option value={3}>Março</option>
            <option value={4}>Abril</option>
            <option value={5}>Maio</option>
            <option value={6}>Junho</option>
            <option value={7}>Julho</option>
            <option value={8}>Agosto</option>
            <option value={9}>Setembro</option>
            <option value={10}>Outubro</option>
            <option value={11}>Novembro</option>
            <option value={12}>Dezembro</option>
          </select>
          <select
            className="erp-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </ErpWindow>

      <div className="grid grid-cols-1 gap-2">
        <ErpWindow title="Produtos com Estoque Baixo">
          <DataGrid
            columns={[
              { key: "code", header: "Código", width: "80px" },
              { key: "name", header: "Produto" },
              {
                key: "current_stock",
                header: "Estoque",
                align: "right",
                render: (item) => (
                  <StatusBadge color={item.current_stock <= 0 ? "red" : "yellow"}>{item.current_stock}</StatusBadge>
                ),
              },
              { key: "min_stock", header: "Mínimo", align: "right" },
            ]}
            data={lowStockProducts}
            emptyMessage="Nenhum produto com estoque baixo"
          />
        </ErpWindow>
      </div>

      <ErpWindow title="Últimas Vendas">
        <DataGrid
          columns={[
            { key: "sale_number", header: "Nº Venda", width: "100px" },
            {
              key: "sale_date",
              header: "Data",
              width: "100px",
              render: (item) => new Date(item.sale_date).toLocaleDateString("pt-BR"),
            },
            {
              key: "customer_name",
              header: "Cliente",
              render: (item) => item.customer_name || "Cliente não informado",
            },
            {
              key: "final_amount",
              header: "Valor",
              align: "right",
              render: (item) => `R$ ${Number(item.final_amount).toFixed(2)}`,
            },
            {
              key: "status",
              header: "Status",
              render: (item) => {
                const statusColors: Record<string, "green" | "yellow" | "red"> = {
                  liquidado: "green",
                  concluida: "green",
                  pendente: "yellow",
                  disputa: "red",
                  cancelada: "red",
                }
                return (
                  <StatusBadge color={statusColors[item.status] || "yellow"}>
                    {item.status.toUpperCase()}
                  </StatusBadge>
                )
              },
            },
          ]}
          data={recentSales}
          emptyMessage="Nenhuma venda registrada"
        />
      </ErpWindow>
    </div>
  )
}
