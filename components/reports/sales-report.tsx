"use client"

import { useState, useEffect, useMemo } from "react"
import { DataGrid } from "@/components/erp/data-grid"
import { StatusBadge } from "@/components/erp/status-badge"
import { salesApi, companyApi } from "@/lib/api"
import type { Sale, Company } from "@/lib/types"
import { generatePDF } from "@/lib/utils/pdf-generator"

const statusOptions = [
  { value: 'disputa', label: 'Disputa' },
  { value: 'aguardando_julgamento', label: 'Ag. Julgamento' },
  { value: 'homologado', label: 'Homologado' },
  { value: 'em_producao', label: 'Em Produção' },
  { value: 'em_transito', label: 'Em Trânsito' },
  { value: 'aguardando_pagamento', label: 'Ag. Pagamento' },
  { value: 'liquidado', label: 'Liquidado' },
]

const statusLabels: Record<string, string> = {
  disputa: 'Disputa',
  aguardando_julgamento: 'Ag. Julgamento',
  homologado: 'Homologado',
  em_producao: 'Em Produção',
  em_transito: 'Em Trânsito',
  aguardando_pagamento: 'Ag. Pagamento',
  liquidado: 'Liquidado',
}

export function SalesReport() {
  const [sales, setSales] = useState<(Sale & { customer: { name: string } | null })[]>([])
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
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([loadSales(), loadCompany()])
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

  const loadSales = async () => {
    try {
      setLoading(true)
      const data = await salesApi.getAll()
      setSales(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao carregar vendas:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = (status: string) => {
    const newStatuses = new Set(selectedStatuses)
    if (newStatuses.has(status)) {
      newStatuses.delete(status)
    } else {
      newStatuses.add(status)
    }
    setSelectedStatuses(newStatuses)
  }

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      const matchesDate = saleDate >= start && saleDate <= end
      const matchesStatus = selectedStatuses.size === 0 || selectedStatuses.has(sale.status)
      return matchesDate && matchesStatus
    })
  }, [sales, startDate, endDate, selectedStatuses])

  const expandedData = useMemo(() => {
    const rows: any[] = []
    filteredSales.forEach(sale => {
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach(item => {
          rows.push({
            id: `${sale.id}-${item.id}`,
            sale_id: sale.id,
            sale_number: sale.sale_number,
            sale_date: sale.sale_date,
            customer_name: sale.customer_name || "Cliente não informado",
            customer_state: sale.customer_state || "",
            product_name: item.product_name || "",
            quantity: item.quantity,
            unit_price: item.unit_price,
            unit_cost: item.unit_cost,
            total_price: item.total_price,
            total_cost: Number(item.unit_cost) * Number(item.quantity),
            profit: item.profit,
            status: sale.status,
          })
        })
      }
    })
    return rows
  }, [filteredSales])

  const toggleSelectAll = () => {
    if (selectedItems.size === expandedData.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(expandedData.map((_, idx) => idx)))
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

    const selectedData = expandedData.filter((_, index) => selectedItems.has(index))

    const n = selectedData.length || 1
    const pdfTotals = selectedData.reduce((acc, row) => ({
      qty: acc.qty + Number(row.quantity),
      unit_price: acc.unit_price + Number(row.unit_price),
      total_price: acc.total_price + Number(row.total_price),
      unit_cost: acc.unit_cost + Number(row.unit_cost),
      total_cost: acc.total_cost + Number(row.total_cost),
      profit: acc.profit + Number(row.profit),
    }), { qty: 0, unit_price: 0, total_price: 0, unit_cost: 0, total_cost: 0, profit: 0 })

    const pdfFooterRow: Record<string, string> = {
      "Venda": "TOTAIS",
      "Data": "",
      "UF": "",
      "Cliente": "",
      "Produto": "",
      "Qtd": pdfTotals.qty.toFixed(0),
      "Valor Uni.": `R$ ${(pdfTotals.unit_price / n).toFixed(2)}`,
      "Valor Total": `R$ ${pdfTotals.total_price.toFixed(2)}`,
      "Custo Uni.": `R$ ${(pdfTotals.unit_cost / n).toFixed(2)}`,
      "C. Total": `R$ ${pdfTotals.total_cost.toFixed(2)}`,
      "Lucro": `R$ ${pdfTotals.profit.toFixed(2)}`,
      "Status": "",
    }

    const pdfData = selectedData.map(row => ({
      "Venda": row.sale_number,
      "Data": (() => { const [y, m, d] = row.sale_date.split('-'); return `${d}/${m}/${y}` })(),
      "UF": row.customer_state,
      "Cliente": row.customer_name,
      "Produto": row.product_name,
      "Qtd": row.quantity.toString(),
      "Valor Uni.": `R$ ${Number(row.unit_price).toFixed(2)}`,
      "Valor Total": `R$ ${Number(row.total_price).toFixed(2)}`,
      "Custo Uni.": `R$ ${Number(row.unit_cost).toFixed(2)}`,
      "C. Total": `R$ ${Number(row.total_cost).toFixed(2)}`,
      "Lucro": `R$ ${Number(row.profit).toFixed(2)}`,
      "Status": statusLabels[row.status] || row.status,
    }))

    const address = [company.street, company.number, company.neighborhood].filter(Boolean).join(", ")
    const city = [company.city, company.state].filter(Boolean).join("/")

    generatePDF({
      reportType: "Relatório de Vendas",
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
        { text: "Venda", width: 45 },
        { text: "Data", width: 50 },
        { text: "UF", width: 25 },
        { text: "Cliente", width: 75 },
        { text: "Produto", width: 80 },
        { text: "Qtd", width: 35, alignment: "right" },
        { text: "Valor Uni.", width: 55, alignment: "right" },
        { text: "Valor Total", width: 55, alignment: "right" },
        { text: "Custo Uni.", width: 55, alignment: "right" },
        { text: "C. Total", width: 55, alignment: "right" },
        { text: "Lucro", width: 55, alignment: "right" },
        { text: "Status", width: 60, alignment: "center" },
      ],
      data: pdfData,
      footerRow: pdfFooterRow,
      observations: `Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`,
      orientation: "landscape",
    })
  }

  if (loading) {
    return <div className="text-[11px] p-2">Carregando vendas...</div>
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

      <div className="flex gap-2 items-center flex-wrap mb-2">
        <label className="text-[11px]">Filtrar por Status:</label>
        {statusOptions.map(status => (
          <button
            key={status.value}
            className={`erp-button !min-w-0 !px-2 !py-1 !text-[10px] ${
              selectedStatuses.has(status.value) ? '!bg-blue-200' : ''
            }`}
            onClick={() => toggleStatus(status.value)}
          >
            {selectedStatuses.has(status.value) ? '✓ ' : ''}{status.label}
          </button>
        ))}
        {selectedStatuses.size > 0 && (
          <button
            className="erp-button !min-w-0 !px-2 !py-1 !text-[10px]"
            onClick={() => setSelectedStatuses(new Set())}
          >
            ✕ Limpar
          </button>
        )}
      </div>

      <div className="flex gap-2 items-center mb-2">
        <input
          type="checkbox"
          checked={selectedItems.size === expandedData.length && expandedData.length > 0}
          onChange={toggleSelectAll}
        />
        <label className="text-[11px]">Selecionar Todos ({selectedItems.size} de {expandedData.length})</label>
      </div>

      <DataGrid
        maxHeight="320px"
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
          { key: "sale_number", header: "Venda", width: "90px" },
          {
            key: "sale_date",
            header: "Data",
            width: "90px",
            render: (item) => {
              const [y, m, d] = item.sale_date.split('-')
              return `${d}/${m}/${y}`
            },
          },
          { key: "customer_state", header: "UF", width: "45px", align: "center" },
          { key: "customer_name", header: "Cliente", width: "140px" },
          { key: "product_name", header: "Produto", width: "140px" },
          {
            key: "quantity",
            header: "Qtd",
            width: "60px",
            align: "right",
            render: (item) => Math.round(Number(item.quantity)).toString(),
          },
          {
            key: "unit_price",
            header: "Valor Uni.",
            width: "85px",
            align: "right",
            render: (item) => `R$ ${Number(item.unit_price).toFixed(2)}`,
          },
          {
            key: "total_price",
            header: "Valor Total",
            width: "95px",
            align: "right",
            render: (item) => `R$ ${Number(item.total_price).toFixed(2)}`,
          },
          {
            key: "unit_cost",
            header: "Custo Uni.",
            width: "90px",
            align: "right",
            render: (item) => `R$ ${Number(item.unit_cost).toFixed(2)}`,
          },
          {
            key: "total_cost",
            header: "C. Total",
            width: "90px",
            align: "right",
            render: (item) => `R$ ${Number(item.total_cost).toFixed(2)}`,
          },
          {
            key: "profit",
            header: "Lucro",
            width: "90px",
            align: "right",
            render: (item) => `R$ ${Number(item.profit).toFixed(2)}`,
          },
          {
            key: "status",
            header: "Status",
            width: "110px",
            align: "center",
            render: (item) => {
              const statusMap: Record<string, { label: string; color: "green" | "yellow" | "cyan" | "orange" | "red" }> = {
                disputa: { label: "Disputa", color: "red" },
                aguardando_julgamento: { label: "Aguard Julg", color: "red" },
                homologado: { label: "Homologado", color: "yellow" },
                em_producao: { label: "Em Produção", color: "cyan" },
                em_transito: { label: "Em Trânsito", color: "cyan" },
                aguardando_pagamento: { label: "Aguard Pag", color: "orange" },
                liquidado: { label: "Liquidado", color: "green" },
              }
              const s = statusMap[item.status] || { label: item.status, color: "yellow" as const }
              return <StatusBadge color={s.color}>{s.label}</StatusBadge>
            },
          },
        ]}
        data={expandedData}
        onRowClick={() => {}}
      />

    </div>
  )
}
