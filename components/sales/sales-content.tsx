"use client"

import { useState } from "react"
import { SaleForm } from "@/components/sales/sale-form"
import { MonthlySummary } from "@/components/sales/monthly-summary"
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
  const [showForm, setShowForm] = useState(false)

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
    if (selectedSale && confirm(`Deseja realmente excluir a venda ${selectedSale.sale_number}?`)) {
      try {
        await salesApi.delete(selectedSale.id)
        await refreshSales()
        setSelectedSale(null)
        alert("Venda excluída com sucesso!")
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
  }

  return (
    <div className="space-y-2">
      {!showForm ? (
        <>
          <div className="flex gap-2 mb-2">
            <button className="erp-button" onClick={handleNew}>
              ➕ Nova Venda
            </button>
            <button 
              className="erp-button" 
              onClick={handleEdit}
              disabled={!selectedSale}
            >
              ✏️ Editar
            </button>
            <button 
              className="erp-button" 
              onClick={handleDelete}
              disabled={!selectedSale}
            >
              🗑️ Excluir
            </button>
            <button className="erp-button" onClick={refreshSales}>
              🔄 Atualizar
            </button>
            {selectedSale && (
              <span className="text-[11px] ml-auto self-center">
                Selecionado: {selectedSale.sale_number}
              </span>
            )}
          </div>
          <MonthlySummary 
            sales={sales} 
            selectedSaleId={selectedSale?.id}
            onSaleSelect={setSelectedSale}
          />
        </>
      ) : (
        <SaleForm 
          customers={customers} 
          products={products} 
          sale={selectedSale}
          onSave={handleSave} 
          onCancel={() => {
            setShowForm(false)
            setSelectedSale(null)
          }} 
        />
      )}
    </div>
  )
}

