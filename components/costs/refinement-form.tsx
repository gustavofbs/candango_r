"use client"

import type React from "react"
import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import { DataGrid } from "@/components/erp/data-grid"
import type { Product } from "@/lib/types"
import { costsApi } from "@/lib/api"

interface RefinementFormProps {
  products: Product[]
  onSave: () => void
  onCancel: () => void
}

interface CostItem {
  cost_type: string
  description: string
  value: number
}

const COST_TYPES = [
  { value: "aviamentos", label: "Aviamentos" },
  { value: "corte_tecido", label: "Corte do tecido" },
  { value: "costura", label: "Costura" },
  { value: "dtf", label: "DTF" },
  { value: "embalagem", label: "Embalagem" },
  { value: "etiqueta", label: "Etiqueta" },
  { value: "silk", label: "Silk" },
  { value: "sublimacao", label: "Sublimação" },
  { value: "tipo_tecido", label: "Tipo de tecido" },
]

export function RefinementForm({ products, onSave, onCancel }: RefinementFormProps) {
  const safeProducts = Array.isArray(products) ? products : []
  
  const [formData, setFormData] = useState({
    product_id: "",
    refinement_name: "",
    date: new Date().toISOString().split("T")[0],
  })
  
  const [costs, setCosts] = useState<CostItem[]>([])
  
  const [newCost, setNewCost] = useState({
    cost_type: "tipo_tecido",
    description: "",
    value: 0,
  })
  
  const [saving, setSaving] = useState(false)

  const addCost = () => {
    if (!newCost.description.trim()) {
      alert("A descrição é obrigatória")
      return
    }
    
    if (newCost.value <= 0) {
      alert("O valor deve ser maior que zero")
      return
    }
    
    // Verifica se já existe custo deste tipo
    if (costs.some(c => c.cost_type === newCost.cost_type)) {
      alert("Já existe um custo deste tipo neste refinamento")
      return
    }
    
    setCosts([...costs, { ...newCost }])
    setNewCost({
      cost_type: "tipo_tecido",
      description: "",
      value: 0,
    })
  }

  const removeCost = (index: number) => {
    setCosts(costs.filter((_, i) => i !== index))
  }

  const totalCost = costs.reduce((acc, cost) => acc + cost.value, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.product_id) {
      alert("Selecione um produto")
      return
    }
    
    if (!formData.refinement_name.trim()) {
      alert("O nome do refinamento é obrigatório")
      return
    }
    
    if (costs.length === 0) {
      alert("Adicione pelo menos um custo ao refinamento")
      return
    }
    
    setSaving(true)

    try {
      // Gera código único do refinamento
      const product = safeProducts.find(p => p.id === Number(formData.product_id))
      const productCode = product?.code || "PROD"
      const timestamp = Date.now().toString().slice(-6)
      const refinementCode = `REF-${productCode}-${timestamp}`
      
      // Cria todos os custos com o mesmo refinement_code
      for (const cost of costs) {
        await costsApi.create({
          product: Number(formData.product_id),
          description: cost.description,
          cost_type: cost.cost_type,
          value: cost.value,
          date: formData.date,
          refinement_code: refinementCode,
          refinement_name: formData.refinement_name,
          notes: null,
        })
      }
      
      alert(`Refinamento ${refinementCode} criado com sucesso!`)
      onSave()
    } catch (error) {
      console.error("Erro ao criar refinamento:", error)
      alert("Erro ao criar refinamento")
    } finally {
      setSaving(false)
    }
  }

  return (
    <ErpWindow title="Novo Refinamento de Custo">
      <form onSubmit={handleSubmit}>
        <FieldGroup label="Dados do Refinamento">
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
            
            <FormField label="Nome do Refinamento:" inline>
              <input
                type="text"
                className="erp-input w-full"
                value={formData.refinement_name}
                onChange={(e) => setFormData({ ...formData, refinement_name: e.target.value })}
                placeholder="Ex: Camiseta Básica Branca - Versão 1"
                required
              />
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
          </div>
        </FieldGroup>

        <FieldGroup label="Adicionar Custo">
          <div className="space-y-2">
            <FormField label="Tipo de Custo:" inline>
              <select
                className="erp-select w-full"
                value={newCost.cost_type}
                onChange={(e) => setNewCost({ ...newCost, cost_type: e.target.value })}
              >
                {COST_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </FormField>
            
            <FormField label="Descrição:" inline>
              <input
                type="text"
                className="erp-input w-full"
                value={newCost.description}
                onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                placeholder="Ex: Malha PV 30.1"
              />
            </FormField>
            
            <FormField label="Valor:" inline>
              <input
                type="number"
                step="0.01"
                min="0"
                className="erp-input w-32"
                value={newCost.value}
                onChange={(e) => setNewCost({ ...newCost, value: Number(e.target.value) })}
              />
            </FormField>
            
            <button type="button" className="erp-button" onClick={addCost}>
              ➕ Adicionar Custo
            </button>
          </div>
        </FieldGroup>

        <FieldGroup label="Custos do Refinamento">
          <DataGrid
            columns={[
              { 
                key: "cost_type", 
                header: "Tipo",
                render: (item) => COST_TYPES.find(t => t.value === item.cost_type)?.label || item.cost_type
              },
              { key: "description", header: "Descrição" },
              {
                key: "value",
                header: "Valor",
                align: "right",
                render: (item) => `R$ ${Number(item.value).toFixed(2)}`,
              },
              {
                key: "actions",
                header: "",
                width: "60px",
                render: (_, index) => (
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
          
          <div className="mt-2 text-[11px] erp-inset p-1 font-bold">
            TOTAL DO REFINAMENTO: R$ {totalCost.toFixed(2)}
          </div>
        </FieldGroup>

        <div className="flex gap-2 mt-4">
          <button type="submit" className="erp-button" disabled={saving}>
            {saving ? "Salvando..." : "💾 Salvar Refinamento"}
          </button>
          <button type="button" className="erp-button" onClick={onCancel} disabled={saving}>
            ❌ Cancelar
          </button>
        </div>
      </form>
    </ErpWindow>
  )
}
