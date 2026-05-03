"use client"

import type React from "react"
import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import { DataGrid } from "@/components/erp/data-grid"
import type { Product } from "@/lib/types"
import { costsApi } from "@/lib/api"

interface ProductionEntryFormProps {
  products: Product[]
  onSave: () => void
  onCancel: () => void
}

interface CostItem {
  cost_type: string
  value: number
}

const DEFAULT_COST_TYPES = [
  { value: "camisa_base", label: "Camisa Base" },
  { value: "aviamentos", label: "Aviamentos" },
  { value: "corte_tecido", label: "Corte do tecido" },
  { value: "costura", label: "Costura" },
  { value: "dtf", label: "DTF" },
  { value: "embalagem", label: "Embalagem" },
  { value: "etiqueta", label: "Etiqueta" },
  { value: "frete", label: "Frete" },
  { value: "silk", label: "Silk" },
  { value: "sublimacao", label: "Sublimação" },
  { value: "tipo_tecido", label: "Tipo de tecido" },
]

export function ProductionEntryForm({ products, onSave, onCancel }: ProductionEntryFormProps) {
  const safeProducts = Array.isArray(products) ? products : []

  const [formData, setFormData] = useState({
    product_id: "",
    date: new Date().toISOString().split("T")[0],
    quantity: "",
    notes: "",
  })

  const [costs, setCosts] = useState<CostItem[]>([])
  const [costTypes, setCostTypes] = useState(DEFAULT_COST_TYPES)
  const [isCustomType, setIsCustomType] = useState(false)
  const [customTypeName, setCustomTypeName] = useState("")
  const [newCost, setNewCost] = useState({ cost_type: "camisa_base", value: 0 })
  const [saving, setSaving] = useState(false)

  const addCustomType = () => {
    if (!customTypeName.trim()) {
      alert("Digite o nome do novo tipo de custo")
      return
    }
    const customValue = customTypeName.toLowerCase().replace(/\s+/g, "_")
    if (costTypes.some((t) => t.value === customValue)) {
      alert("Este tipo de custo já existe")
      return
    }
    setCostTypes([...costTypes, { value: customValue, label: customTypeName }])
    setNewCost({ ...newCost, cost_type: customValue })
    setCustomTypeName("")
    setIsCustomType(false)
  }

  const addCost = () => {
    if (newCost.value <= 0) {
      alert("O valor deve ser maior que zero")
      return
    }
    if (costs.some((c) => c.cost_type === newCost.cost_type)) {
      alert("Já existe um custo deste tipo nesta entrada")
      return
    }
    setCosts([...costs, { ...newCost }])
    setNewCost({ cost_type: "camisa_base", value: 0 })
  }

  const removeCost = (index: number) => {
    setCosts(costs.filter((_, i) => i !== index))
  }

  const totalUnitCost = costs.reduce((acc, c) => acc + c.value, 0)
  const totalBatchCost = totalUnitCost * (Number(formData.quantity) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.product_id) { alert("Selecione um produto"); return }
    if (!formData.quantity || Number(formData.quantity) <= 0) { alert("Informe a quantidade"); return }
    if (costs.length === 0) { alert("Adicione pelo menos um custo"); return }

    setSaving(true)
    try {
      await costsApi.saveProductionEntry({
        product_id: Number(formData.product_id),
        date: formData.date,
        quantity: Number(formData.quantity),
        costs: costs.map((c) => ({ cost_type: costTypes.find((t) => t.value === c.cost_type)?.label || c.cost_type, value: c.value })),
        notes: formData.notes || undefined,
      })
      onSave()
    } catch (error) {
      console.error("Erro ao salvar entrada:", error)
      alert("Erro ao salvar entrada de produção")
    } finally {
      setSaving(false)
    }
  }

  return (
    <ErpWindow title="Nova Entrada de Produção">
      <form onSubmit={handleSubmit}>
        <FieldGroup label="Dados da Entrada">
          <div className="space-y-2">
            <FormField label="Produto:" inline>
              <select
                className="erp-select w-full"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                required
              >
                <option value="">Selecione...</option>
                {safeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Data:" inline>
              <input
                type="date"
                className="erp-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Quantidade:" inline>
              <input
                type="number"
                className="erp-input w-32"
                placeholder="0"
                min="1"
                step="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Observações:" inline>
              <input
                type="text"
                className="erp-input w-full"
                placeholder="Opcional..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </FormField>
          </div>
        </FieldGroup>

        <FieldGroup label="Adicionar Custo Unitário">
          <div className="space-y-2">
            <FormField label="Tipo de Custo:" inline>
              <div className="flex gap-2 w-full">
                <select
                  className="erp-select flex-1"
                  value={newCost.cost_type}
                  onChange={(e) => setNewCost({ ...newCost, cost_type: e.target.value })}
                  disabled={isCustomType}
                >
                  {costTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="erp-button"
                  onClick={() => setIsCustomType(!isCustomType)}
                >
                  {isCustomType ? "❌" : "➕ Novo Tipo"}
                </button>
              </div>
            </FormField>

            {isCustomType && (
              <FormField label="Nome do Novo Tipo:" inline>
                <div className="flex gap-2 w-full">
                  <input
                    type="text"
                    className="erp-input flex-1"
                    value={customTypeName}
                    onChange={(e) => setCustomTypeName(e.target.value)}
                    placeholder="Ex: Bordado, Estampa..."
                  />
                  <button type="button" className="erp-button" onClick={addCustomType}>
                    ✅ Adicionar Tipo
                  </button>
                </div>
              </FormField>
            )}

            <FormField label="Valor Unit.:" inline>
              <input
                type="text"
                className="erp-input w-32"
                value={newCost.value === 0 ? "" : `R$ ${Number(newCost.value).toFixed(2).replace(".", ",")}`}
                onChange={(e) => {
                  const numeric = e.target.value.replace(/\D/g, "")
                  setNewCost({ ...newCost, value: numeric === "" ? 0 : Number(numeric) / 100 })
                }}
                placeholder="R$ 0,00"
              />
            </FormField>

            <button type="button" className="erp-button" onClick={addCost}>
              ➕ Adicionar Custo
            </button>
          </div>
        </FieldGroup>

        <FieldGroup label="Custos da Entrada">
          <DataGrid
            columns={[
              {
                key: "cost_type",
                header: "Tipo",
                render: (item: CostItem) =>
                  costTypes.find((t) => t.value === item.cost_type)?.label || item.cost_type,
              },
              {
                key: "value",
                header: "Valor Unit.",
                align: "right",
                render: (item: CostItem) => `R$ ${Number(item.value).toFixed(2)}`,
              },
              {
                key: "actions",
                header: "",
                width: "60px",
                render: (_: CostItem, index: number) => (
                  <button
                    type="button"
                    className="erp-button !min-w-0 !p-1"
                    onClick={() => removeCost(index)}
                  >
                    🗑️
                  </button>
                ),
              },
            ]}
            data={costs}
            emptyMessage="Nenhum custo adicionado"
          />

          <div className="mt-2 space-y-1">
            <div className="text-[11px] erp-inset p-1 font-bold">
              Custo Unit. Total: R$ {totalUnitCost.toFixed(2)}
            </div>
            {formData.quantity && Number(formData.quantity) > 0 && (
              <div className="text-[11px] erp-inset p-1">
                Total do Lote ({formData.quantity} un.): R$ {totalBatchCost.toFixed(2)}
              </div>
            )}
          </div>
        </FieldGroup>

        <div className="flex gap-2 mt-4">
          <button type="submit" className="erp-button" disabled={saving}>
            {saving ? "Salvando..." : "💾 Salvar Entrada"}
          </button>
          <button type="button" className="erp-button" onClick={onCancel} disabled={saving}>
            ❌ Cancelar
          </button>
        </div>
      </form>
    </ErpWindow>
  )
}
