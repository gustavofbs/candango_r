"use client"

import { useState, useEffect } from "react"
import { DataGrid } from "@/components/erp/data-grid"
import { customersApi, companyApi } from "@/lib/api"
import type { Customer, Company } from "@/lib/types"
import { generatePDF } from "@/lib/utils/pdf-generator"

export function CustomersReport() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([loadCustomers(), loadCompany()])
  }

  const loadCompany = async () => {
    try {
      const companies = await companyApi.getAll()
      if (companies && companies.length > 0) {
        setCompany(companies[0])
      }
    } catch (error) {
      console.error("Erro ao carregar empresa:", error)
    }
  }

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const data = await customersApi.getAll()
      setCustomers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === customers.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(customers.map((_, idx) => idx)))
    }
  }

  const toggleSelectItem = (index: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedItems(newSelected)
  }

  const handleGeneratePDF = async () => {
    if (selectedItems.size === 0) {
      alert("Selecione pelo menos um item para gerar o PDF")
      return
    }

    if (!company) {
      alert("Dados da empresa não encontrados. Cadastre a empresa primeiro.")
      return
    }

    // Filtrar apenas os itens selecionados
    const selectedData = customers.filter((_, index) => selectedItems.has(index))

    // Preparar dados para o PDF
    const pdfData = selectedData.map(customer => ({
      "Nome": customer.name,
      "CPF/CNPJ": customer.document,
      "Telefone": customer.phone,
      "Email": customer.email,
    }))

    // Montar endereço completo
    const address = [company.street, company.number, company.neighborhood].filter(Boolean).join(", ")
    const city = [company.city, company.state].filter(Boolean).join("/")

    generatePDF({
      reportType: "Relatório de Clientes",
      reportDate: new Date().toLocaleDateString('pt-BR'),
      companyInfo: {
        name: company.nome_fantasia,
        cnpj: company.cnpj,
        address: address,
        city: city,
        phone: company.phone,
        email: company.email,
        contact: company.responsavel || undefined,
      },
      columns: [
        { text: "Nome", width: "*" },
        { text: "CPF/CNPJ", width: 100 },
        { text: "Telefone", width: 90 },
        { text: "Email", width: 120 },
      ],
      data: pdfData,
    })
  }

  if (loading) {
    return <div className="text-[11px] p-2">Carregando clientes...</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center mb-2">
        <button className="erp-button ml-auto" onClick={handleGeneratePDF}>
          📄 Gerar PDF
        </button>
      </div>

      <div className="flex gap-2 items-center mb-2">
        <input
          type="checkbox"
          checked={selectedItems.size === customers.length && customers.length > 0}
          onChange={toggleSelectAll}
        />
        <label className="text-[11px]">Selecionar Todos ({selectedItems.size} de {customers.length})</label>
      </div>

      <DataGrid
        columns={[
          {
            key: "checkbox",
            header: "✓",
            width: "30px",
            render: (item, index) => (
              <input
                type="checkbox"
                checked={selectedItems.has(index!)}
                onChange={() => toggleSelectItem(index!)}
              />
            ),
          },
          { key: "name", header: "Nome", width: "200px" },
          { key: "cpf_cnpj", header: "CPF/CNPJ", width: "120px" },
          { key: "phone", header: "Telefone", width: "120px" },
          { key: "email", header: "Email", width: "200px" },
          {
            key: "address",
            header: "Endereço",
            render: (item) => {
              const parts = [
                item.street,
                item.number,
                item.neighborhood,
                item.city,
                item.state
              ].filter(Boolean)
              return parts.join(", ")
            },
          },
        ]}
        data={customers}
        onRowClick={() => {}}
      />

      <div className="mt-2 text-[11px] erp-inset p-1">
        <span>Total de clientes: {customers.length}</span>
      </div>
    </div>
  )
}
