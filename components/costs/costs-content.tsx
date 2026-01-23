"use client"

import type React from "react"

import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { Toolbar } from "@/components/erp/toolbar"
import { StatusBadge } from "@/components/erp/status-badge"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import type { ProductionCost, Product } from "@/lib/types"
import { costsApi } from "@/lib/api"

interface CostsContentProps {
  initialCosts: (ProductionCost & { product: { name: string; code: string } | null })[]
  products: Product[]
}

export function CostsContent({ initialCosts, products }: CostsContentProps) {
  const [costs, setCosts] = useState(Array.isArray(initialCosts) ? initialCosts : [])
  const [selectedCost, setSelectedCost] = useState<ProductionCost | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState("")
  const [formData, setFormData] = useState({
    product_id: "",
    description: "",
    cost_type: "material",
    value: 0,
    date: new Date().toISOString().split("T")[0],
    notes: "",
  })
  const [saving, setSaving] = useState(false)

  const refreshCosts = async () => {
    try {
      const data = await costsApi.getAll()
      setCosts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao atualizar custos:", error)
    }
  }

  const handleNew = () => {
    setSelectedCost(null)
    setFormData({
      product_id: "",
      description: "",
      cost_type: "material",
      value: 0,
      date: new Date().toISOString().split("T")[0],
      notes: "",
    })
    setShowForm(true)
  }

  const handleEdit = () => {
    if (selectedCost) {
      setFormData({
        product_id: String(selectedCost.product),
        description: selectedCost.description,
        cost_type: selectedCost.cost_type,
        value: Number(selectedCost.value),
        date: selectedCost.date,
        notes: selectedCost.notes || "",
      })
      setShowForm(true)
    }
  }

  const handleDelete = async () => {
    if (selectedCost && confirm("Deseja realmente excluir este custo?")) {
      try {
        await costsApi.delete(selectedCost.id)
        await refreshCosts()
        setSelectedCost(null)
        setSelectedIndex(undefined)
      } catch (error) {
        console.error("Erro ao excluir custo:", error)
        alert("Erro ao excluir custo")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.product_id) {
      alert("Selecione um produto")
      return
    }
    
    if (!formData.description.trim()) {
      alert("A descrição é obrigatória")
      return
    }
    
    setSaving(true)

    try {
      const data = {
        product: Number(formData.product_id),
        description: formData.description,
        cost_type: formData.cost_type,
        value: Number(formData.value),
        date: formData.date,
        notes: formData.notes,
      }

      console.log("Dados sendo enviados:", data)

      if (selectedCost) {
        await costsApi.update(selectedCost.id, data)
      } else {
        await costsApi.create(data)
      }

      await refreshCosts()
      setShowForm(false)
      setSelectedCost(null)
      setSelectedIndex(undefined)
    } catch (error: any) {
      console.error("Erro ao salvar custo:", error)
      console.error("Dados da resposta:", error?.response?.data)
      console.error("Status:", error?.response?.status)
      
      const errorData = error?.response?.data
      let errorMessage = "Erro ao salvar custo"
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData
        } else if (errorData.product) {
          errorMessage = `Produto: ${errorData.product[0]}`
        } else if (errorData.description) {
          errorMessage = `Descrição: ${errorData.description[0]}`
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else {
          errorMessage = JSON.stringify(errorData)
        }
      }
      
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setSelectedCost(null)
    setSelectedIndex(undefined)
  }

  const handleSaveComplete = async () => {
    setSaving(false)
    setShowForm(false)
    setSelectedCost(null)
    setSelectedIndex(undefined)
    await refreshCosts()
  }

  const filteredCosts = costs.filter(
    (c) =>
      c.product_name?.toLowerCase().includes(filter.toLowerCase()) ||
      c.description.toLowerCase().includes(filter.toLowerCase()),
  )

  const costTypeLabels: Record<string, string> = {
    material: "Material",
    mao_obra: "Mão de Obra",
    energia: "Energia",
    transporte: "Transporte",
    outros: "Outros",
  }

  const costTypeColors: Record<string, "green" | "yellow" | "cyan" | "orange" | "red" | "white"> = {
    material: "green",
    mao_obra: "cyan",
    energia: "yellow",
    transporte: "red",
    outros: "white",
  }

  return (
    <div className="space-y-2">
      <ErpWindow title="Custos de Produção">
        <Toolbar
          buttons={[
            { label: "Novo", icon: "➕", onClick: handleNew },
            { label: "Editar", icon: "✏️", onClick: handleEdit, disabled: !selectedCost },
            { label: "Excluir", icon: "🗑️", onClick: handleDelete, disabled: !selectedCost },
            { label: "Atualizar", icon: "🔄", onClick: refreshCosts },
          ]}
        />

        <div className="flex gap-2 mb-2">
          <label className="text-[11px]">Filtrar:</label>
          <input
            type="text"
            className="erp-input flex-1"
            placeholder="Digite o produto ou descrição..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <DataGrid
          columns={[
            {
              key: "date",
              header: "Data",
              width: "100px",
              render: (item) => new Date(item.date).toLocaleDateString("pt-BR"),
            },
            {
              key: "product",
              header: "Produto",
              render: (item) => item.product_name || "-",
            },
            { key: "description", header: "Descrição" },
            {
              key: "cost_type",
              header: "Tipo",
              width: "120px",
              render: (item) => (
                <StatusBadge color={costTypeColors[item.cost_type] || "white"}>
                  {costTypeLabels[item.cost_type] || item.cost_type}
                </StatusBadge>
              ),
            },
            {
              key: "value",
              header: "Valor",
              width: "100px",
              align: "right",
              render: (item) => `R$ ${Number(item.value).toFixed(2)}`,
            },
            { key: "notes", header: "Observações" },
          ]}
          data={filteredCosts}
          selectedIndex={selectedIndex}
          onRowClick={(item, index) => {
            setSelectedCost(item)
            setSelectedIndex(index)
          }}
        />

        <div className="mt-2 text-[11px] erp-inset p-1">
          Total de registros: {filteredCosts.length} | Valor Total: R${" "}
          {filteredCosts.reduce((acc, c) => acc + Number(c.value), 0).toFixed(2)}
        </div>
      </ErpWindow>

      {showForm && (
        <ErpWindow title={selectedCost ? "Editar Custo" : "Novo Custo"}>
          <form onSubmit={handleSubmit}>
            <FieldGroup label="Dados do Custo">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormField label="Produto:" inline>
                    <select
                      className="erp-select w-full"
                      value={formData.product_id}
                      onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                      required
                    >
                      <option value="">Selecione...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Descrição:" inline>
                    <input
                      type="text"
                      className="erp-input w-full"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </FormField>
                  <FormField label="Tipo:" inline>
                    <select
                      className="erp-select"
                      value={formData.cost_type}
                      onChange={(e) => setFormData({ ...formData, cost_type: e.target.value })}
                    >
                      <option value="material">Material</option>
                      <option value="mao_obra">Mão de Obra</option>
                      <option value="energia">Energia</option>
                      <option value="transporte">Transporte</option>
                      <option value="outros">Outros</option>
                    </select>
                  </FormField>
                </div>
                <div className="space-y-2">
                  <FormField label="Data:" inline>
                    <input
                      type="date"
                      className="erp-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </FormField>
                  <FormField label="Valor:" inline>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="erp-input w-28"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                      required
                    />
                  </FormField>
                  <FormField label="Observações:" inline>
                    <input
                      type="text"
                      className="erp-input w-full"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </FormField>
                </div>
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

