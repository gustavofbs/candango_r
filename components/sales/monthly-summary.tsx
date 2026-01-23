"use client"

import { useState, useMemo } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { StatusBadge } from "@/components/erp/status-badge"
import type { Sale } from "@/lib/types"

interface MonthlySummaryProps {
  sales: Sale[]
}

export function MonthlySummary({ sales }: MonthlySummaryProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Filtra vendas do mês selecionado e expande os itens
  const monthlyData = useMemo(() => {
    const [year, month] = selectedMonth.split('-')
    
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date)
      return saleDate.getFullYear() === parseInt(year) && 
             saleDate.getMonth() + 1 === parseInt(month)
    })

    // Expande cada venda em linhas por item
    const rows: any[] = []
    filteredSales.forEach(sale => {
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach(item => {
          rows.push({
            id: `${sale.id}-${item.id}`,
            sale_date: sale.sale_date,
            sale_number: sale.sale_number,
            customer_name: sale.customer_name || "Cliente não informado",
            product_code: item.product_code || "",
            product_name: item.product_name || "",
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            unit_cost: item.unit_cost,
            total_cost: item.total_cost,
            tax: item.tax,
            freight: item.freight,
            profit: item.profit,
            status: sale.status,
          })
        })
      }
    })

    return rows
  }, [sales, selectedMonth])

  // Calcula totais
  const totals = useMemo(() => {
    return monthlyData.reduce((acc, row) => ({
      quantity: acc.quantity + Number(row.quantity),
      unit_price: acc.unit_price + Number(row.unit_price),
      total_price: acc.total_price + Number(row.total_price),
      unit_cost: acc.unit_cost + Number(row.unit_cost),
      total_cost: acc.total_cost + Number(row.total_cost),
      tax: acc.tax + Number(row.tax),
      freight: acc.freight + Number(row.freight),
      profit: acc.profit + Number(row.profit),
    }), {
      quantity: 0,
      unit_price: 0,
      total_price: 0,
      unit_cost: 0,
      total_cost: 0,
      tax: 0,
      freight: 0,
      profit: 0,
    })
  }, [monthlyData])

  return (
    <ErpWindow title={`Resumo Mensal - ${selectedMonth}`}>
      <div className="flex gap-2 mb-2 items-center">
        <label className="text-[11px]">Mês/Ano:</label>
        <input
          type="month"
          className="erp-input w-40"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
        <span className="text-[11px] ml-4">
          Total de itens: {monthlyData.length}
        </span>
      </div>

      <DataGrid
        columns={[
          {
            key: "sale_date",
            header: "Data",
            width: "80px",
            render: (item) => new Date(item.sale_date).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' }),
          },
          { key: "sale_number", header: "NF", width: "80px" },
          { key: "customer_name", header: "Cliente", width: "150px" },
          { 
            key: "product", 
            header: "Produto",
            render: (item) => item.product_code ? `${item.product_code} - ${item.product_name}` : item.product_name,
          },
          { 
            key: "quantity", 
            header: "Quant", 
            width: "60px", 
            align: "right",
            render: (item) => Number(item.quantity).toFixed(0),
          },
          {
            key: "unit_price",
            header: "Valor Unit.",
            width: "90px",
            align: "right",
            render: (item) => `R$ ${Number(item.unit_price).toFixed(2)}`,
          },
          {
            key: "total_price",
            header: "Valor Total",
            width: "100px",
            align: "right",
            render: (item) => `R$ ${Number(item.total_price).toFixed(2)}`,
          },
          {
            key: "unit_cost",
            header: "Custo Unit.",
            width: "90px",
            align: "right",
            render: (item) => `R$ ${Number(item.unit_cost).toFixed(2)}`,
          },
          {
            key: "total_cost",
            header: "Custo Total",
            width: "100px",
            align: "right",
            render: (item) => `R$ ${Number(item.total_cost).toFixed(2)}`,
          },
          {
            key: "tax",
            header: "Imposto",
            width: "90px",
            align: "right",
            render: (item) => `R$ ${Number(item.tax).toFixed(2)}`,
          },
          {
            key: "freight",
            header: "Frete",
            width: "80px",
            align: "right",
            render: (item) => `R$ ${Number(item.freight).toFixed(2)}`,
          },
          {
            key: "profit",
            header: "Lucro",
            width: "100px",
            align: "right",
            render: (item) => `R$ ${Number(item.profit).toFixed(2)}`,
          },
          {
            key: "status",
            header: "Status",
            width: "90px",
            render: (item) => (
              <StatusBadge
                color={item.status === "concluida" ? "green" : item.status === "pendente" ? "yellow" : "red"}
              >
                {item.status === "concluida" ? "Concluída" : item.status === "pendente" ? "Pendente" : "Cancelada"}
              </StatusBadge>
            ),
          },
        ]}
        data={monthlyData}
        selectedIndex={undefined}
        onRowClick={() => {}}
      />

      <div className="mt-2 text-[11px] erp-inset p-2">
        <div className="font-bold mb-1">Resumo &gt;&gt;</div>
        <div className="grid grid-cols-8 gap-2">
          <div>
            <span className="font-bold">Quant:</span> {totals.quantity.toFixed(0)}
          </div>
          <div>
            <span className="font-bold">V. Unit:</span> R$ {totals.unit_price.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">V. Total:</span> R$ {totals.total_price.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">C. Unit:</span> R$ {totals.unit_cost.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">C. Total:</span> R$ {totals.total_cost.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">Imposto:</span> R$ {totals.tax.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">Frete:</span> R$ {totals.freight.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">Lucro:</span> R$ {totals.profit.toFixed(2)}
          </div>
        </div>
      </div>
    </ErpWindow>
  )
}
