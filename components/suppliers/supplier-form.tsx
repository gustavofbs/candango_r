"use client"

import type React from "react"

import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import type { Supplier } from "@/lib/types"
import { suppliersApi } from "@/lib/api"

interface SupplierFormProps {
  supplier: Supplier | null
  onSave: () => void
  onCancel: () => void
}

export function SupplierForm({ supplier, onSave, onCancel }: SupplierFormProps) {
  const [formData, setFormData] = useState({
    code: supplier?.code || "",
    name: supplier?.name || "",
    document: supplier?.document || "",
    contact_name: supplier?.contact_name || "",
    email: supplier?.email || "",
    phone: supplier?.phone || "",
    address: supplier?.address || "",
    city: supplier?.city || "",
    state: supplier?.state || "",
    notes: supplier?.notes || "",
    active: supplier?.active ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (supplier) {
        await suppliersApi.update(supplier.id, formData)
      } else {
        await suppliersApi.create(formData)
      }
      onSave()
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error)
      alert("Erro ao salvar fornecedor")
    } finally {
      setSaving(false)
    }
  }

  return (
    <ErpWindow title={supplier ? "Editar Fornecedor" : "Novo Fornecedor"}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2">
          <FieldGroup label="Dados do Fornecedor">
            <div className="space-y-2">
              <FormField label="Código:" inline>
                <input
                  type="text"
                  className="erp-input w-32"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Razão Social:" inline>
                <input
                  type="text"
                  className="erp-input w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="CNPJ:" inline>
                <input
                  type="text"
                  className="erp-input w-40"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                />
              </FormField>
              <FormField label="Contato:" inline>
                <input
                  type="text"
                  className="erp-input w-full"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                />
              </FormField>
              <FormField label="E-mail:" inline>
                <input
                  type="email"
                  className="erp-input w-full"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </FormField>
              <FormField label="Telefone:" inline>
                <input
                  type="text"
                  className="erp-input w-36"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </FormField>
            </div>
          </FieldGroup>

          <FieldGroup label="Endereço">
            <div className="space-y-2">
              <FormField label="Endereço:" inline>
                <input
                  type="text"
                  className="erp-input w-full"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </FormField>
              <FormField label="Cidade:" inline>
                <input
                  type="text"
                  className="erp-input w-40"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </FormField>
              <FormField label="UF:" inline>
                <input
                  type="text"
                  className="erp-input w-12"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                />
              </FormField>
              <FormField label="Observações:" inline>
                <textarea
                  className="erp-input w-full h-16"
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

