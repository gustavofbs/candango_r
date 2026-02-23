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
  // Pega o refinement_code, customer_id e product_id dos custos selecionados
  const refinementCode = costs.length > 0 ? costs[0].refinement_code : null
  const customerId = costs.length > 0 ? costs[0].customer : null
  const productId = costs.length > 0 ? costs[0].product : null

  const [editedCosts, setEditedCosts] = useState(
    costs.map(cost => ({
      id: cost.id,
      date: cost.date,
      value: cost.value.toString(),
      cost_type: cost.cost_type,
      description: cost.description,
    }))
  )

  const [showAddForm, setShowAddForm] = useState(false)
  const [newCost, setNewCost] = useState({
    date: new Date().toISOString().split("T")[0],
    cost_type: "",
    value: 0,
  })

  const handleAddCost = async () => {
    if (newCost.value <= 0) {
      alert("O valor deve ser maior que zero")
      return
    }

    try {
      await costsApi.create({
        customer: customerId,
        product: productId || undefined,
        date: newCost.date,
        value: Number(newCost.value),
        cost_type: newCost.cost_type,
        description: "",
        refinement_code: refinementCode,
      })
      alert('Custo adicionado com sucesso!')
      setShowAddForm(false)
      setNewCost({
        date: new Date().toISOString().split("T")[0],
        cost_type: "",
        value: 0,
      })
    } catch (error) {
      console.error('Erro ao adicionar custo:', error)
      alert('Erro ao adicionar custo')
    }
  }

  const handleSave = async () => {
    try {
      for (let i = 0; i < editedCosts.length; i++) {
        const cost = editedCosts[i]
        const originalCost = costs[i]
        await costsApi.update(cost.id, {
          customer: originalCost.customer,
          product: originalCost.product,
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
      <div className="mb-4">
        <button 
          className="erp-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Cancelar Adição' : '➕ Adicionar Novo Custo'}
        </button>
      </div>

      {showAddForm && (
        <FieldGroup label="Adicionar Novo Custo">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Data:" inline>
              <input
                type="date"
                className="erp-input"
                value={newCost.date}
                onChange={(e) => setNewCost({ ...newCost, date: e.target.value })}
              />
            </FormField>

            <FormField label="Tipo de Custo:" inline>
              <input
                type="text"
                className="erp-input w-full"
                value={newCost.cost_type}
                onChange={(e) => setNewCost({ ...newCost, cost_type: e.target.value })}
                placeholder="Digite o tipo de custo"
              />
            </FormField>

            <FormField label="Valor:" inline>
              <input
                type="text"
                className="erp-input w-32"
                value={newCost.value === 0 ? '' : `R$ ${Number(newCost.value).toFixed(2).replace('.', ',')}`}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, '')
                  const valueInReais = numericValue ? Number(numericValue) / 100 : 0
                  setNewCost({ ...newCost, value: valueInReais })
                }}
                placeholder="R$ 0,00"
              />
            </FormField>

          </div>

          <div className="mt-2">
            <button className="erp-button" onClick={handleAddCost}>
              ✓ Adicionar Custo
            </button>
          </div>
        </FieldGroup>
      )}

      <div className="space-y-4 max-h-[600px] overflow-y-auto mt-4">
        {editedCosts.map((cost, index) => {
          const originalCost = costs[index]
          return (
            <FieldGroup key={cost.id} label={`Custo ${index + 1} - ${originalCost.cost_type_display || originalCost.cost_type}`}>
              <div className="grid grid-cols-2 gap-4">
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
        <button className="erp-button" onClick={async () => {
          await handleSave()
          onSave()
        }}>
          � Salvar Edições
        </button>
        <button className="erp-button" onClick={onCancel}>
          ✕ Fechar
        </button>
      </div>
    </ErpWindow>
  )
}
