"use client"

import { useState, useEffect, useMemo } from "react"
import { DataGrid } from "@/components/erp/data-grid"
import { costsApi, companyApi } from "@/lib/api"
import type { ProductionCost, Company } from "@/lib/types"
import { generatePDF } from "@/lib/utils/pdf-generator"

interface CostRow {
  id: string
  sale_number: string
  date: string
  customer_name: string
  product_name: string
  product_code: string
  quantity: number
  camisa_lisa: number
  dtf_silk: number
  frete_uber: number
  imposto: number
  total: number
}

export function CostsReport() {
  const [costs, setCosts] = useState<ProductionCost[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(1)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    return date.toISOString().split('T')[0]
  })
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([loadCosts(), loadCompany()])
  }

  const loadCompany = async () => {
    try {
      const companies = await companyApi.getAll()
      if (companies && companies.length > 0) setCompany(companies[0])
    } catch (error) {
      console.error("Erro ao carregar empresa:", error)
    }
  }

  const loadCosts = async () => {
    try {
      setLoading(true)
      const data = await costsApi.getAll()
      setCosts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao carregar custos:", error)
    } finally {
      setLoading(false)
    }
  }

  const costRows = useMemo((): CostRow[] => {
    const groups: { [key: string]: CostRow } = {}

    costs.forEach((cost) => {
      const refCode = cost.refinement_code || `SINGLE-${cost.id}`

      const costDate = new Date(cost.date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      if (costDate < start || costDate > end) return

      if (!groups[refCode]) {
        let saleNumber = cost.locked_by_sale_number || ''
        if (!saleNumber && cost.refinement_code?.startsWith('REF-')) {
          const parts = cost.refinement_code.split('-')
          if (parts.length >= 2) saleNumber = parts[1]
        }
        groups[refCode] = {
          id: refCode,
          sale_number: saleNumber,
          date: cost.date,
          customer_name: cost.customer_name || '',
          product_name: cost.product_name || '',
          product_code: cost.product_code || '',
          quantity: Number(cost.quantity) || 0,
          camisa_lisa: 0,
          dtf_silk: 0,
          frete_uber: 0,
          imposto: 0,
          total: 0,
        }
      }

      const qty = groups[refCode].quantity
      const value = Number(cost.value) * qty
      if (cost.cost_type === 'Camisa Lisa') groups[refCode].camisa_lisa = value
      else if (cost.cost_type === 'DTF/Silk/Sublimação') groups[refCode].dtf_silk = value
      else if (cost.cost_type === 'Frete/Uber') groups[refCode].frete_uber = value
      else if (cost.cost_type === 'Imposto') groups[refCode].imposto = value
      groups[refCode].total += value
    })

    return Object.values(groups)
  }, [costs, startDate, endDate])

  const toggleSelectAll = () => {
    if (selectedItems.size === costRows.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(costRows.map((_, idx) => idx)))
    }
  }

  const toggleSelectItem = (index: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(index)) newSelected.delete(index)
    else newSelected.add(index)
    setSelectedItems(newSelected)
  }

  const handleGeneratePDF = () => {
    if (selectedItems.size === 0) {
      alert("Selecione pelo menos um item para gerar o PDF")
      return
    }
    if (!company) {
      alert("Dados da empresa não encontrados. Cadastre a empresa primeiro.")
      return
    }

    const selectedData = costRows.filter((_, idx) => selectedItems.has(idx))
    const fmt = (v: number) => `R$ ${v.toFixed(2)}`

    const pdfData = selectedData.map((row) => ({
      "Código": row.sale_number || row.id,
      "Data": (() => { const [y, m, d] = row.date.split('-'); return `${d}/${m}/${y}` })(),
      "Cliente": row.customer_name,
      "Produto": `${row.product_code} - ${row.product_name}`,
      "Qtd": row.quantity ? Math.round(row.quantity).toString() : '-',
      "C. Camisa Lisa": fmt(row.camisa_lisa),
      "C. DTF/Silk/Sub.": fmt(row.dtf_silk),
      "C. Frete/Uber": fmt(row.frete_uber),
      "C. Imposto": fmt(row.imposto),
      "Total": fmt(row.total),
    }))

    const address = [company.street, company.number, company.neighborhood].filter(Boolean).join(", ")
    const city = [company.city, company.state].filter(Boolean).join("/")

    generatePDF({
      reportType: "Custos de Produção",
      reportDate: new Date().toLocaleDateString('pt-BR'),
      companyInfo: {
        name: company.nome_fantasia,
        cnpj: company.cnpj,
        address,
        city,
        phone: company.phone,
        email: company.email,
        contact: company.responsavel || undefined,
      },
      columns: [
        { text: "Código", width: 45 },
        { text: "Data", width: 50 },
        { text: "Cliente", width: 85 },
        { text: "Produto", width: "*" },
        { text: "Qtd", width: 30, alignment: "right" },
        { text: "C. Camisa Lisa", width: 65, alignment: "right" },
        { text: "C. DTF/Silk/Sub.", width: 65, alignment: "right" },
        { text: "C. Frete/Uber", width: 60, alignment: "right" },
        { text: "C. Imposto", width: 55, alignment: "right" },
        { text: "Total", width: 55, alignment: "right" },
      ],
      data: pdfData,
      orientation: "landscape",
    })
  }

  if (loading) {
    return <div className="text-[11px] p-2">Carregando custos...</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center mb-2 flex-wrap">
        <label className="text-[11px]">Data Início:</label>
        <input
          type="date"
          className="erp-input w-32"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label className="text-[11px] ml-2">Data Fim:</label>
        <input
          type="date"
          className="erp-input w-32"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button className="erp-button ml-auto" onClick={handleGeneratePDF}>
          📄 Gerar PDF
        </button>
      </div>

      <div className="flex gap-2 items-center mb-2">
        <input
          type="checkbox"
          checked={selectedItems.size === costRows.length && costRows.length > 0}
          onChange={toggleSelectAll}
        />
        <label className="text-[11px]">
          Selecionar Todos ({selectedItems.size} de {costRows.length})
        </label>
      </div>

      <DataGrid
        maxHeight="320px"
        columns={[
          {
            key: "checkbox",
            header: "✓",
            width: "30px",
            render: (item: CostRow, index?: number) => (
              <input
                type="checkbox"
                checked={selectedItems.has(index!)}
                onChange={() => toggleSelectItem(index!)}
              />
            ),
          },
          { key: "sale_number", header: "Código", width: "80px" },
          {
            key: "date",
            header: "Data",
            width: "90px",
            render: (item: CostRow) => {
              const [y, m, d] = item.date.split('-')
              return `${d}/${m}/${y}`
            },
          },
          { key: "customer_name", header: "Cliente", width: "150px" },
          {
            key: "product_name",
            header: "Produto",
            width: "170px",
            render: (item: CostRow) => `${item.product_code} - ${item.product_name}`,
          },
          {
            key: "quantity",
            header: "Qtd",
            width: "55px",
            align: "right",
            render: (item: CostRow) => item.quantity ? Math.round(item.quantity).toString() : '-',
          },
          {
            key: "camisa_lisa",
            header: "C. Camisa Lisa",
            width: "95px",
            align: "right",
            render: (item: CostRow) => `R$ ${item.camisa_lisa.toFixed(2)}`,
          },
          {
            key: "dtf_silk",
            header: "C. DTF/Silk/Sub.",
            width: "105px",
            align: "right",
            render: (item: CostRow) => `R$ ${item.dtf_silk.toFixed(2)}`,
          },
          {
            key: "frete_uber",
            header: "C. Frete/Uber",
            width: "95px",
            align: "right",
            render: (item: CostRow) => `R$ ${item.frete_uber.toFixed(2)}`,
          },
          {
            key: "imposto",
            header: "C. Imposto",
            width: "85px",
            align: "right",
            render: (item: CostRow) => `R$ ${item.imposto.toFixed(2)}`,
          },
          {
            key: "total",
            header: "Total",
            width: "85px",
            align: "right",
            render: (item: CostRow) => `R$ ${item.total.toFixed(2)}`,
          },
        ]}
        data={costRows}
        onRowClick={() => {}}
      />
    </div>
  )
}
