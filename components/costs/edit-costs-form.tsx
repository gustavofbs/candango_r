"use client"

import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import type { ProductionCost, Customer, Product } from "@/lib/types"
import { costsApi } from "@/lib/api"

interface EditCostsFormProps {
  costs: ProductionCost[]
  customers: Customer[]
  products: Product[]
  onSave: () => void
  onCancel: () => void
}

export function EditCostsForm({ costs, customers, products, onSave, onCancel }: EditCostsFormProps) {
  const [editedCosts, setEditedCosts] = useState(
    costs.map(cost => ({
      id: cost.id,
      customer_id: cost.customer?.toString() || "",
      product_id: cost.product.toString(),
      date: cost.date,
      value: cost.value.toString(),
      cost_type: cost.cost_type,
      description: cost.description,
    }))
  )

  const handleSave = async () => {
    try {
      for (const cost of editedCosts) {
        await costsApi.update(cost.id, {
          customer: cost.customer_id ? Number(cost.customer_id) : null,
          product: Number(cost.product_id),
          date: cost.date,
          value: Number(cost.value),
          cost_type: cost.cost_type,
          description: cost.description,
        })
      }
      alert('Custos atualizados com sucesso!')
      onSave()
    } catch (error) {
      console.error('Erro ao atualizar custos:', error)
      alert('Erro ao atualizar custos')
    }
  }

  const updateCost = (index: number, field: string, value: string) => {
    const newCosts = [...editedCosts]
    newCosts[index] = { ...newCosts[index], [field]: value }
    setEditedCosts(newCosts)
  }

  return (
    <ErpWindow title={`Editar ${costs.length} Custo(s)`}>
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {editedCosts.map((cost, index) => {
          const originalCost = costs[index]
          return (
            <FieldGroup key={cost.id} label={`Custo ${index + 1} - ${originalCost.cost_type_display || originalCost.cost_type}`}>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Cliente:" inline>
                  <select
                    className="erp-select w-full"
                    value={cost.customer_id}
                    onChange={(e) => updateCost(index, 'customer_id', e.target.value)}
                  >
                    <option value="">Nenhum</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Produto:" inline>
                  <select
                    className="erp-select w-full"
                    value={cost.product_id}
                    onChange={(e) => updateCost(index, 'product_id', e.target.value)}
                  >
                    {products.map((p) => (
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
                    value={cost.date}
                    onChange={(e) => updateCost(index, 'date', e.target.value)}
                  />
                </FormField>

                <FormField label="Valor:" inline>
                  <input
                    type="text"
                    className="erp-input w-32"
                    value={cost.value === '0' || cost.value === '' ? '' : `R$ ${Number(cost.value).toFixed(2).replace('.', ',')}`}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, '')
                      const valueInReais = numericValue ? (Number(numericValue) / 100).toString() : '0'
                      updateCost(index, 'value', valueInReais)
                    }}
                  />
                </FormField>
              </div>
            </FieldGroup>
          )
        })}
      </div>

      <div className="flex gap-2 mt-4">
        <button className="erp-button" onClick={handleSave}>
          Salvar
        </button>
        <button className="erp-button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </ErpWindow>
  )
}
