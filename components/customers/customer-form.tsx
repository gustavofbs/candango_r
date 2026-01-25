"use client"

import type React from "react"

import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import type { Customer } from "@/lib/types"
import { customersApi } from "@/lib/api"

interface CustomerFormProps {
  customer: Customer | null
  onSave: () => void
  onCancel: () => void
}

export function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    document: customer?.document || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    zipcode: customer?.zipcode || "",
    address: customer?.address || "",
    neighborhood: customer?.neighborhood || "",
    city: customer?.city || "",
    state: customer?.state || "",
    notes: customer?.notes || "",
    active: customer?.active ?? true,
  })
  const [loadingCep, setLoadingCep] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleCepBlur = async () => {
    const cep = formData.zipcode.replace(/\D/g, '')
    if (cep.length === 8) {
      setLoadingCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setFormData({
            ...formData,
            address: data.logradouro || formData.address,
            neighborhood: data.bairro || formData.neighborhood,
            city: data.localidade || formData.city,
            state: data.uf || formData.state,
          })
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      } finally {
        setLoadingCep(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (customer) {
        await customersApi.update(customer.id, formData)
      } else {
        await customersApi.create(formData)
      }
      onSave()
    } catch (error: any) {
      console.error("Erro ao salvar cliente:", error)
      const errorMessage = error?.response?.data ? JSON.stringify(error.response.data) : "Erro ao salvar cliente"
      alert(`Erro ao salvar cliente: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ErpWindow title={customer ? "Editar Cliente" : "Novo Cliente"}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2">
          <FieldGroup label="Dados Básicos">
            <div className="space-y-2">
              <FormField label="Nome:" inline>
                <input
                  type="text"
                  className="erp-input w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="CPF/CNPJ:" inline>
                <input
                  type="text"
                  className="erp-input w-40"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
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
              <FormField label="CEP:" inline>
                <input
                  type="text"
                  className="erp-input w-32"
                  value={formData.zipcode}
                  onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {loadingCep && <span className="text-xs ml-2">Buscando...</span>}
              </FormField>
              <FormField label="Endereço:" inline>
                <input
                  type="text"
                  className="erp-input w-full"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </FormField>
              <FormField label="Bairro:" inline>
                <input
                  type="text"
                  className="erp-input w-48"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
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

