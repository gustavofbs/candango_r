"use client"

import type React from "react"
import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import type { Company } from "@/lib/types"
import { companyApi } from "@/lib/api"

interface CompanyFormProps {
  company: Company | null
  onSave: () => void
  onCancel: () => void
}

export function CompanyForm({ company, onSave, onCancel }: CompanyFormProps) {
  const [formData, setFormData] = useState({
    razao_social: company?.razao_social || "",
    nome_fantasia: company?.nome_fantasia || "",
    cnpj: company?.cnpj || "",
    inscricao_estadual: company?.inscricao_estadual || "",
    cep: company?.cep || "",
    street: company?.street || "",
    number: company?.number || "",
    complement: company?.complement || "",
    neighborhood: company?.neighborhood || "",
    city: company?.city || "",
    state: company?.state || "",
    phone: company?.phone || "",
    email: company?.email || "",
    website: company?.website || "",
    responsavel: company?.responsavel || "",
    active: company?.active ?? true,
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(company?.logo_url || null)
  const [loadingCep, setLoadingCep] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, "")
    if (cep.length === 8) {
      setLoadingCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setFormData({
            ...formData,
            street: data.logradouro || formData.street,
            neighborhood: data.bairro || formData.neighborhood,
            city: data.localidade || formData.city,
            state: data.uf || formData.state,
          })
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error)
      } finally {
        setLoadingCep(false)
      }
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const submitData = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          submitData.append(key, value.toString())
        }
      })
      
      if (logoFile) {
        submitData.append('logo', logoFile)
      }

      if (company) {
        await companyApi.update(company.id, submitData)
      } else {
        await companyApi.create(submitData)
      }
      onSave()
    } catch (error: any) {
      console.error("Erro ao salvar empresa:", error)
      const errorMessage = error?.response?.data
        ? JSON.stringify(error.response.data)
        : "Erro ao salvar empresa"
      alert(`Erro ao salvar empresa: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ErpWindow title={company ? "Editar Empresa" : "Cadastrar Empresa"}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2">
          <FieldGroup label="Dados da Empresa">
            <div className="space-y-2">
              <FormField label="Razão Social:" inline>
                <input
                  type="text"
                  className="erp-input w-full"
                  value={formData.razao_social}
                  onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Nome Fantasia:" inline>
                <input
                  type="text"
                  className="erp-input w-full"
                  value={formData.nome_fantasia}
                  onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                />
              </FormField>
              <FormField label="CNPJ:" inline>
                <input
                  type="text"
                  className="erp-input w-48"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </FormField>
              <FormField label="Insc. Estadual:" inline>
                <input
                  type="text"
                  className="erp-input w-40"
                  value={formData.inscricao_estadual}
                  onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
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
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  required
                />
                {loadingCep && <span className="text-xs ml-2">Buscando...</span>}
              </FormField>
              <FormField label="Rua:" inline>
                <input
                  type="text"
                  className="erp-input w-full"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Número:" inline>
                <input
                  type="text"
                  className="erp-input w-24"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Complemento:" inline>
                <input
                  type="text"
                  className="erp-input w-full"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                />
              </FormField>
              <FormField label="Bairro:" inline>
                <input
                  type="text"
                  className="erp-input w-full"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Cidade:" inline>
                <input
                  type="text"
                  className="erp-input w-full"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="UF:" inline>
                <input
                  type="text"
                  className="erp-input w-16"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  maxLength={2}
                  required
                />
              </FormField>
            </div>
          </FieldGroup>

          <FieldGroup label="Contato">
            <div className="space-y-2">
              <FormField label="Telefone:" inline>
                <input
                  type="text"
                  className="erp-input w-40"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  required
                />
              </FormField>
              <FormField label="E-mail:" inline>
                <input
                  type="email"
                  className="erp-input w-full"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Website:" inline>
                <input
                  type="url"
                  className="erp-input w-full"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.exemplo.com.br"
                />
              </FormField>
              <FormField label="Responsável:" inline>
                <input
                  type="text"
                  className="erp-input w-full"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  required
                />
              </FormField>
            </div>
          </FieldGroup>

          <FieldGroup label="Logo">
            <div className="space-y-2">
              <input
                type="file"
                id="logo-upload"
                className="hidden"
                accept="image/*"
                onChange={handleLogoChange}
              />
              <div
                className="cursor-pointer erp-inset p-2 hover:opacity-80 transition-opacity inline-block"
                onClick={() => document.getElementById('logo-upload')?.click()}
                title="Clique para alterar a logo"
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo da empresa"
                    className="max-w-[200px] max-h-[100px] object-contain"
                  />
                ) : (
                  <div className="w-[200px] h-[100px] flex items-center justify-center text-gray-500 text-sm">
                    Clique para adicionar logo
                  </div>
                )}
              </div>
            </div>
          </FieldGroup>
        </div>

        <div className="flex gap-2 mt-4">
          <button type="submit" className="erp-button" disabled={saving}>
            {saving ? "Salvando..." : company ? "Atualizar" : "Cadastrar"}
          </button>
          <button type="button" className="erp-button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </ErpWindow>
  )
}
