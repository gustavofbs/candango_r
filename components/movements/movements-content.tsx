"use client"

import type React from "react"

import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { Toolbar } from "@/components/erp/toolbar"
import { StatusBadge } from "@/components/erp/status-badge"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import type { StockMovement, Product } from "@/lib/types"
import { movementsApi } from "@/lib/api"

interface MovementsContentProps {
  initialMovements: (StockMovement & { product: { name: string; code: string } | null })[]
  products: Product[]
}

export function MovementsContent({ initialMovements, products }: MovementsContentProps) {
  const [movements, setMovements] = useState(Array.isArray(initialMovements) ? initialMovements : [])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [formData, setFormData] = useState({
    product_id: "",
    movement_type: "entrada",
    quantity: 1,
    unit_price: 0,
    notes: "",
  })
  const [saving, setSaving] = useState(false)

  const refreshMovements = async () => {
    try {
      const data = await movementsApi.getAll()
      setMovements(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao atualizar movimentações:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const product = products.find((p) => p.id === Number(formData.product_id))
    if (!product) {
      setSaving(false)
      return
    }

    // Create movement (API will update stock automatically)
    await movementsApi.create({
      product: Number(formData.product_id),
      movement_type: formData.movement_type,
      quantity: formData.quantity,
      unit_price: formData.unit_price,
      reference_type: formData.reference_type,
      notes: formData.notes,
    })

    setSaving(false)
    setShowForm(false)
    setFormData({
      product_id: "",
      movement_type: "entrada",
      quantity: 1,
      unit_price: 0,
      notes: "",
    })
    await refreshMovements()
  }

  const filteredMovements = movements.filter((m) => {
    const matchesText =
      m.product_name?.toLowerCase().includes(filter.toLowerCase()) ||
      m.product_code?.toLowerCase().includes(filter.toLowerCase())
    const matchesType = !typeFilter || m.movement_type === typeFilter
    return matchesText && matchesType
  })

  return (
    <div className="space-y-2">
      <ErpWindow title="Movimentações de Estoque">
        <Toolbar
          buttons={[
            { label: "Nova Movimentação", icon: "➕", onClick: () => setShowForm(true) },
            { label: "Atualizar", icon: "🔄", onClick: refreshMovements },
          ]}
        />

        <div className="flex gap-4 mb-2">
          <div className="flex gap-2 flex-1">
            <label className="text-[11px]">Filtrar:</label>
            <input
              type="text"
              className="erp-input flex-1"
              placeholder="Digite o código ou nome do produto..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <label className="text-[11px]">Tipo:</label>
            <select className="erp-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </div>
        </div>

        <DataGrid
          columns={[
            {
              key: "created_at",
              header: "Data/Hora",
              width: "140px",
              render: (item) => new Date(item.created_at).toLocaleString("pt-BR"),
            },
            {
              key: "product",
              header: "Produto",
              render: (item) => (item.product_code && item.product_name ? `${item.product_code} - ${item.product_name}` : item.product_name || "-"),
            },
            {
              key: "movement_type",
              header: "Tipo",
              width: "80px",
              render: (item) => (
                <StatusBadge
                  color={item.movement_type === "entrada" ? "green" : item.movement_type === "saida" ? "red" : "yellow"}
                >
                  {item.movement_type.toUpperCase()}
                </StatusBadge>
              ),
            },
            { key: "quantity", header: "Qtd", width: "60px", align: "right" },
            {
              key: "unit_price",
              header: "Preço Unit.",
              width: "100px",
              align: "right",
              render: (item) => (item.unit_price ? `R$ ${Number(item.unit_price).toFixed(2)}` : "-"),
            },
            {
              key: "total_price",
              header: "Total",
              width: "100px",
              align: "right",
              render: (item) => (item.total_price ? `R$ ${Number(item.total_price).toFixed(2)}` : "-"),
            },
            { key: "reference_type", header: "Referência", width: "80px" },
            { key: "notes", header: "Observações" },
          ]}
          data={filteredMovements}
        />

        <div className="mt-2 text-[11px] erp-inset p-1">Total de movimentações: {filteredMovements.length}</div>
      </ErpWindow>

      {showForm && (
        <ErpWindow title="Nova Movimentação">
          <form onSubmit={handleSubmit}>
            <FieldGroup label="Dados da Movimentação">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormField label="Produto:" inline>
                    <select
                      className="erp-select w-full"
                      value={formData.product_id}
                      onChange={(e) => {
                        const product = products.find((p) => p.id === Number(e.target.value))
                        setFormData({
                          ...formData,
                          product_id: e.target.value,
                          unit_price: product?.purchase_price || 0,
                        })
                      }}
                      required
                    >
                      <option value="">Selecione...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name} (Est: {p.current_stock})
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Tipo:" inline>
                    <select
                      className="erp-select"
                      value={formData.movement_type}
                      onChange={(e) => setFormData({ ...formData, movement_type: e.target.value })}
                    >
                      <option value="entrada">Entrada</option>
                      <option value="saida">Saída</option>
                      <option value="ajuste">Ajuste</option>
                    </select>
                  </FormField>
                </div>
                <div className="space-y-2">
                  <FormField label="Quantidade:" inline>
                    <input
                      type="number"
                      min="1"
                      className="erp-input w-20"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      required
                    />
                  </FormField>
                  <FormField label="Preço Unit.:" inline>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="erp-input w-28"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                    />
                  </FormField>
                </div>
              </div>
              <div className="mt-2">
                <FormField label="Observações:" inline>
                  <input
                    type="text"
                    className="erp-input w-full"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </FormField>
              </div>
            </FieldGroup>

            <div className="flex justify-end gap-2 mt-4">
              <button type="submit" className="erp-button" disabled={saving}>
                {saving ? "Salvando..." : "💾 Salvar"}
              </button>
              <button type="button" className="erp-button" onClick={() => setShowForm(false)}>
                ❌ Cancelar
              </button>
            </div>
          </form>
        </ErpWindow>
      )}
    </div>
  )
}

