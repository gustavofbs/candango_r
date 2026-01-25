"use client"

import type React from "react"

import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import type { Expense } from "@/lib/types"
import { expensesApi } from "@/lib/api"

interface ExpenseFormProps {
  expense: Expense | null
  onSave: () => void
  onCancel: () => void
}

export function ExpenseForm({ expense, onSave, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    name: expense?.name || "",
    amount: expense?.amount || 0,
    expense_type: expense?.expense_type || "FIXO",
    date: expense?.date || new Date().toISOString().split('T')[0],
    notes: expense?.notes || "",
    active: expense?.active ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (expense) {
        await expensesApi.update(expense.id, formData)
      } else {
        await expensesApi.create(formData)
      }
      onSave()
    } catch (error: any) {
      console.error("Erro ao salvar despesa:", error)
      const errorMessage = error?.response?.data ? JSON.stringify(error.response.data) : "Erro ao salvar despesa"
      alert(`Erro ao salvar despesa: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ErpWindow title={expense ? "Editar Despesa" : "Nova Despesa"}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2">
          <FieldGroup label="Dados da Despesa">
            <div className="space-y-2">
              <FormField label="Nome da Despesa:" inline>
                <input
                  type="text"
                  className="erp-input w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Valor:" inline>
                <input
                  type="text"
                  className="erp-input w-40"
                  value={formData.amount === 0 ? "" : `R$ ${Number(formData.amount).toFixed(2).replace('.', ',')}`}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '')
                    const valueInReais = numericValue === "" ? 0 : Number(numericValue) / 100
                    setFormData({ ...formData, amount: valueInReais })
                  }}
                  placeholder="R$ 0,00"
                  required
                />
              </FormField>
              <FormField label="Tipo:" inline>
                <select
                  className="erp-input w-40"
                  value={formData.expense_type}
                  onChange={(e) => setFormData({ ...formData, expense_type: e.target.value as 'FIXO' | 'VARIAVEL' })}
                  required
                >
                  <option value="FIXO">Fixo</option>
                  <option value="VARIAVEL">Variável</option>
                </select>
              </FormField>
              <FormField label="Data:" inline>
                <input
                  type="date"
                  className="erp-input w-40"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </FormField>
            </div>
          </FieldGroup>

          <FieldGroup label="Informações Adicionais">
            <div className="space-y-2">
              <FormField label="Observações:" inline>
                <textarea
                  className="erp-input w-full h-32"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </FormField>
              <FormField label="Ativo:" inline>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
              </FormField>
            </div>
          </FieldGroup>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button type="submit" className="erp-button" disabled={saving}>
            {saving ? "Salvando..." : "💾 Salvar"}
          </button>
          <button type="button" className="erp-button" onClick={onCancel}>
            ❌ Cancelar
          </button>
        </div>
      </form>
    </ErpWindow>
  )
}
