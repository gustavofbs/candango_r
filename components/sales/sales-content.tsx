"use client"

import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { Toolbar } from "@/components/erp/toolbar"
import { StatusBadge } from "@/components/erp/status-badge"
import { SaleForm } from "@/components/sales/sale-form"
import type { Sale, Customer, Product } from "@/lib/types"
import { salesApi } from "@/lib/api"

interface SalesContentProps {
  initialSales: (Sale & { customer: { name: string } | null })[]
  customers: Customer[]
  products: Product[]
}

export function SalesContent({ initialSales, customers, products }: SalesContentProps) {
  const [sales, setSales] = useState(Array.isArray(initialSales) ? initialSales : [])
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState("")

  const refreshSales = async () => {
    try {
      const data = await salesApi.getAll()
      setSales(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao atualizar vendas:", error)
    }
  }

  const handleNew = () => {
    setSelectedSale(null)
    setShowForm(true)
  }

  const handleEdit = () => {
    if (selectedSale) {
      setShowForm(true)
    }
  }

  const handleDelete = async () => {
    if (selectedSale && confirm("Deseja realmente excluir esta venda?")) {
      try {
        await salesApi.delete(selectedSale.id)
        await refreshSales()
        setSelectedSale(null)
        setSelectedIndex(undefined)
      } catch (error) {
        console.error("Erro ao excluir venda:", error)
        alert("Erro ao excluir venda")
      }
    }
  }

  const handleSave = async () => {
    await refreshSales()
    setShowForm(false)
    setSelectedSale(null)
    setSelectedIndex(undefined)
  }

  const filteredSales = sales.filter(
    (s) =>
      s.sale_number.toLowerCase().includes(filter.toLowerCase()) ||
      (s.customer?.name && s.customer.name.toLowerCase().includes(filter.toLowerCase())),
  )

  return (
    <div className="space-y-2">
      <ErpWindow title="Gestão de Vendas">
        <Toolbar
          buttons={[
            { label: "Nova Venda", icon: "➕", onClick: handleNew },
            { label: "Excluir", icon: "🗑️", onClick: handleDelete, disabled: !selectedSale },
            { label: "Atualizar", icon: "🔄", onClick: refreshSales },
          ]}
        />

        <div className="flex gap-2 mb-2">
          <label className="text-[11px]">Filtrar:</label>
          <input
            type="text"
            className="erp-input flex-1"
            placeholder="Digite o número da venda ou cliente..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

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
              key: "customer",
              header: "Cliente",
              render: (item) => item.customer_name || "Cliente não informado",
            },
            {
              key: "total_amount",
              header: "Total",
              align: "right",
              render: (item) => `R$ ${Number(item.total_amount).toFixed(2)}`,
            },
            {
              key: "discount",
              header: "Desconto",
              align: "right",
              render: (item) => `R$ ${Number(item.discount).toFixed(2)}`,
            },
            {
              key: "final_amount",
              header: "Valor Final",
              align: "right",
              render: (item) => `R$ ${Number(item.final_amount).toFixed(2)}`,
            },
            { key: "payment_method", header: "Pagamento", width: "100px" },
            {
              key: "status",
              header: "Status",
              render: (item) => (
                <StatusBadge
                  color={item.status === "concluida" ? "green" : item.status === "pendente" ? "yellow" : "red"}
                >
                  {item.status.toUpperCase()}
                </StatusBadge>
              ),
            },
          ]}
          data={filteredSales}
          selectedIndex={selectedIndex}
          onRowClick={(item, index) => {
            setSelectedSale(item)
            setSelectedIndex(index)
          }}
        />

        <div className="mt-2 text-[11px] erp-inset p-1">
          Total de vendas: {filteredSales.length} | Valor Total: R${" "}
          {filteredSales.reduce((acc, s) => acc + Number(s.final_amount), 0).toFixed(2)}
        </div>
      </ErpWindow>

      {showForm && (
        <SaleForm customers={customers} products={products} onSave={handleSave} onCancel={() => setShowForm(false)} />
      )}
    </div>
  )
}

