"use client"

import { useState, useEffect } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { StatusBadge } from "@/components/erp/status-badge"
import type { Product, Sale } from "@/lib/types"
import { dashboardApi } from "@/lib/api"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts"

interface ExpenseCategoryData {
  categoria: string
  total: number
}

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
  cumulativeProfit: number
  cumulativeExpenses: number
  annualRevenue: number
  selectedMonth: number
  selectedYear: number
  expensesByCategory: ExpenseCategoryData[]
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
      setData({ ...result, expensesByCategory: result.expensesByCategory || [] })
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

  const { totalProducts, totalCustomers, totalSuppliers, lowStockProducts, recentSales, cumulativeProfit, cumulativeExpenses, annualRevenue, expensesByCategory } = data

  const BAR_COLORS = [
    "#000080", "#800000", "#008000", "#800080",
    "#008080", "#808000", "#0000FF", "#FF0000",
  ]

  const fmtCurrency = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return (
    <div className="space-y-2">
      <ErpWindow title="Dashboard - Visão Geral">
        <div className="grid grid-cols-6 gap-2 mb-4">
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
            <div className="text-2xl font-bold text-[#008000]">
              R$ {formatCurrency(annualRevenue)}
            </div>
            <div className="text-[11px]">Faturamento Anual</div>
            <div className="text-[9px] text-gray-600 mt-1">
              Bruto {selectedYear}
            </div>
          </div>
          <div className="erp-inset p-3 text-center">
            <div className="text-2xl font-bold text-[#FF0000]">
              R$ {formatCurrency(cumulativeExpenses)}
            </div>
            <div className="text-[11px]">Despesas Acumuladas</div>
          </div>
          <div className="erp-inset p-3 text-center">
            <div
              className={`text-2xl font-bold ${
                cumulativeProfit >= 0 ? "text-[#008000]" : "text-[#FF0000]"
              }`}
            >
              R$ {formatCurrency(cumulativeProfit)}
            </div>
            <div className="text-[11px]">Lucro Acumulado</div>
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

      <ErpWindow title="Despesas Variáveis por Categoria">
        {expensesByCategory.length === 0 ? (
          <div className="p-4 text-center text-[11px] text-gray-500">
            Nenhuma despesa variável cadastrada com categoria.
          </div>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={expensesByCategory}
                margin={{ top: 24, right: 24, left: 16, bottom: 48 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#c0c0c0" />
                <XAxis
                  dataKey="categoria"
                  tick={{ fontSize: 10, fill: "#333" }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tickFormatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`}
                  tick={{ fontSize: 10, fill: "#333" }}
                  width={90}
                />
                <Tooltip
                  formatter={(value: number) => [fmtCurrency(value), "Total"]}
                  contentStyle={{ fontSize: 11, border: "1px solid #808080" }}
                />
                <Bar dataKey="total" radius={[2, 2, 0, 0]} maxBarSize={64}>
                  {expensesByCategory.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="total"
                    position="top"
                    formatter={(v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                    style={{ fontSize: 9, fill: "#333" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ErpWindow>

      <ErpWindow title="Últimas Vendas">
        <DataGrid
          columns={[
            { key: "sale_number", header: "Nº Venda", width: "100px" },
            {
              key: "sale_date",
              header: "Data",
              width: "100px",
              render: (item) => new Date(item.sale_date as string).toLocaleDateString("pt-BR"),
            },
            {
              key: "customer_name",
              header: "Cliente",
              render: (item) => (item.customer_name as string) || "Cliente não informado",
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
                const s = item.status as string
                return (
                  <StatusBadge color={statusColors[s] || "yellow"}>
                    {s.toUpperCase()}
                  </StatusBadge>
                )
              },
            },
          ]}
          data={recentSales as any[]}
          emptyMessage="Nenhuma venda registrada"
        />
      </ErpWindow>
    </div>
  )
}
