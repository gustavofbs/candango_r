"use client"

import type React from "react"
import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import { DataGrid } from "@/components/erp/data-grid"
import type { Product, Customer } from "@/lib/types"
import { costsApi } from "@/lib/api"

interface RefinementFormProps {
  products: Product[]
  customers: Customer[]
  onSave: () => void
  onCancel: () => void
}

interface CostItem {
  cost_type: string
  description: string
  value: number
}

const DEFAULT_COST_TYPES = [
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

export function RefinementForm({ products, customers, onSave, onCancel }: RefinementFormProps) {
  const safeProducts = Array.isArray(products) ? products : []
  const safeCustomers = Array.isArray(customers) ? customers : []
  
  const [formData, setFormData] = useState({
    customer_id: "",
    product_id: "",
    date: new Date().toISOString().split("T")[0],
  })
  
  const [costs, setCosts] = useState<CostItem[]>([])
  const [costTypes, setCostTypes] = useState(DEFAULT_COST_TYPES)
  const [isCustomType, setIsCustomType] = useState(false)
  const [customTypeName, setCustomTypeName] = useState("")
  
  const [newCost, setNewCost] = useState({
    cost_type: "tipo_tecido",
    value: 0,
  })
  
  const [saving, setSaving] = useState(false)

  const addCustomType = () => {
    if (!customTypeName.trim()) {
      alert("Digite o nome do novo tipo de custo")
      return
    }
    
    const customValue = customTypeName.toLowerCase().replace(/\s+/g, "_")
    
    if (costTypes.some(t => t.value === customValue)) {
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
    
    // Verifica se já existe custo deste tipo
    if (costs.some(c => c.cost_type === newCost.cost_type)) {
      alert("Já existe um custo deste tipo neste refinamento")
      return
    }
    
    setCosts([...costs, { ...newCost, description: "" }])
    setNewCost({
      cost_type: "tipo_tecido",
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
          customer: formData.customer_id ? Number(formData.customer_id) : null,
          description: "",
          cost_type: cost.cost_type,
          value: cost.value,
          date: formData.date,
          refinement_code: refinementCode,
          refinement_name: refinementCode,
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
    <ErpWindow title="Novo Custo">
      <form onSubmit={handleSubmit}>
        <FieldGroup label="Dados do Refinamento">
          <div className="space-y-2">
            <FormField label="Cliente:" inline>
              <select
                className="erp-select w-full"
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              >
                <option value="">Nenhum (Pendente)</option>
                {safeCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

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
          </div>
        </FieldGroup>

        <FieldGroup label="Adicionar Custo">
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
                    placeholder="Ex: Bordado, Estampa, etc."
                  />
                  <button
                    type="button"
                    className="erp-button"
                    onClick={addCustomType}
                  >
                    ✅ Adicionar Tipo
                  </button>
                </div>
              </FormField>
            )}
            
            <FormField label="Valor:" inline>
              <input
                type="text"
                className="erp-input w-32"
                value={newCost.value === 0 ? "" : `R$ ${Number(newCost.value).toFixed(2).replace('.', ',')}`}
                onChange={(e) => {
                  // Remove tudo exceto números
                  const numericValue = e.target.value.replace(/\D/g, '')
                  // Converte centavos para reais (divide por 100)
                  const valueInReais = numericValue === "" ? 0 : Number(numericValue) / 100
                  setNewCost({ ...newCost, value: valueInReais })
                }}
                placeholder="R$ 0,00"
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
                render: (item) => costTypes.find(t => t.value === item.cost_type)?.label || item.cost_type
              },
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
