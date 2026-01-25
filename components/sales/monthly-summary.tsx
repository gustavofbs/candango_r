"use client"

import { useState, useMemo } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { StatusBadge } from "@/components/erp/status-badge"
import type { Sale } from "@/lib/types"

interface MonthlySummaryProps {
  sales: Sale[]
  selectedSaleId?: number
  onSaleSelect?: (sale: Sale) => void
}

export function MonthlySummary({ sales, selectedSaleId, onSaleSelect }: MonthlySummaryProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | undefined>()

  // Filtra vendas do mês selecionado e expande os itens
  const monthlyData = useMemo(() => {
    const [year, month] = selectedMonth.split('-')
    
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date)
      return saleDate.getFullYear() === parseInt(year) && 
             saleDate.getMonth() + 1 === parseInt(month)
    })

    // Ordena vendas por sale_number (crescente)
    const sortedSales = [...filteredSales].sort((a, b) => {
      return a.sale_number.localeCompare(b.sale_number)
    })

    // Expande cada venda em linhas por item
    const rows: any[] = []
    const saleMap: Record<string, Sale> = {}
    
    sortedSales.forEach(sale => {
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach(item => {
          // Calcula imposto baseado no percentual sobre o valor total
          const calculatedTax = (Number(item.total_price) * Number(sale.tax_percentage || 0)) / 100
          
          const rowId = `${sale.id}-${item.id}`
          const totalCost = Number(item.unit_cost) * Number(item.quantity)
          
          rows.push({
            id: rowId,
            sale_id: sale.id,
            sale_number: sale.sale_number,
            sale_date: sale.sale_date,
            customer_state: sale.customer_state || "",
            sale_type: sale.sale_type || "venda",
            customer_name: sale.customer_name || "Cliente não informado",
            product_name: item.product_name || "",
            nf: sale.nf || "",
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            unit_cost: item.unit_cost,
            total_cost: totalCost,
            tax: calculatedTax,
            freight: item.freight,
            profit: item.profit,
            status: sale.status,
          })
          saleMap[rowId] = sale
        })
      }
    })

    return { rows, saleMap }
  }, [sales, selectedMonth])

  // Calcula totais
  const totals = useMemo(() => {
    const rowCount = monthlyData.rows.length
    const sums = monthlyData.rows.reduce((acc, row) => ({
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
    
    // Calcula médias para unit_price e unit_cost
    return {
      ...sums,
      unit_price: rowCount > 0 ? sums.unit_price / rowCount : 0,
      unit_cost: rowCount > 0 ? sums.unit_cost / rowCount : 0,
    }
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
          Total de itens: {monthlyData.rows.length}
        </span>
      </div>

      <DataGrid
        columns={[
          { key: "sale_number", header: "Venda", width: "100px" },
          {
            key: "sale_date",
            header: "Data",
            width: "100px",
            render: (item) => new Date(item.sale_date).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' }),
          },
          { key: "customer_state", header: "UF", width: "50px" },
          {
            key: "sale_type",
            header: "Tipo",
            width: "80px",
            render: (item) => {
              const typeMap: Record<string, string> = {
                venda: "Venda",
                dispensa: "Dispensa",
                pregao: "Pregão",
              }
              return typeMap[item.sale_type] || item.sale_type
            },
          },
          { key: "customer_name", header: "Cliente", width: "150px" },
          { key: "product_name", header: "Produto", width: "150px" },
          { key: "nf", header: "NF", width: "100px" },
          { 
            key: "quantity", 
            header: "Quantidade", 
            width: "80px", 
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
            header: "C. Total",
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
            width: "120px",
            render: (item) => {
              const statusMap: Record<string, { label: string; color: "green" | "yellow" | "cyan" | "orange" | "red" }> = {
                disputa: { label: "Disputa", color: "red" },
                homologado: { label: "Homologado", color: "yellow" },
                producao: { label: "Produção", color: "cyan" },
                aguardando_pagamento: { label: "Aguard. Pag.", color: "orange" },
                liquidado: { label: "Liquidado", color: "green" },
              }
              const status = statusMap[item.status] || { label: item.status, color: "white" as const }
              return (
                <StatusBadge color={status.color}>
                  {status.label}
                </StatusBadge>
              )
            },
          },
        ]}
        data={monthlyData.rows}
        selectedIndex={selectedRowIndex}
        onRowClick={(row, index) => {
          setSelectedRowIndex(index)
          if (onSaleSelect) {
            const sale = monthlyData.saleMap[row.id]
            if (sale) {
              onSaleSelect(sale)
            }
          }
        }}
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
