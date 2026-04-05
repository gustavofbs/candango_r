"use client"

import { useState, useMemo, useEffect } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { StatusBadge } from "@/components/erp/status-badge"
import type { Sale, Customer } from "@/lib/types"
import { companyApi, customersApi } from "@/lib/api"
import type { Company } from "@/lib/types"
import { generatePDF } from "@/lib/utils/pdf-generator"

interface MonthlySummaryProps {
  sales: Sale[]
  selectedSaleId?: number
  onSaleSelect?: (sale: Sale) => void
}

export function MonthlySummary({ sales, selectedSaleId, onSaleSelect }: MonthlySummaryProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  })
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | undefined>()
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set())
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [company, setCompany] = useState<Company | null>(null)

  useEffect(() => {
    loadCompany()
  }, [])

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

  const toggleStatus = (status: string) => {
    const newStatuses = new Set(selectedStatuses)
    if (newStatuses.has(status)) {
      newStatuses.delete(status)
    } else {
      newStatuses.add(status)
    }
    setSelectedStatuses(newStatuses)
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

  const handleGenerateProposal = async (monthlyData: any) => {
    if (selectedItems.size === 0) {
      alert("Selecione pelo menos um item para gerar a proposta")
      return
    }

    // Verificar se todos os itens selecionados são da mesma venda
    const selectedSaleIds = new Set<number>()
    selectedItems.forEach((index: number) => {
      const row = monthlyData.rows[index]
      if (row) {
        selectedSaleIds.add(row.sale_id)
      }
    })
    
    if (selectedSaleIds.size !== 1) {
      alert("Selecione apenas itens da mesma venda para gerar a proposta")
      return
    }

    if (!company) {
      alert("Dados da empresa não encontrados. Cadastre a empresa primeiro.")
      return
    }

    // Filtrar apenas os itens selecionados
    const selectedData = monthlyData.rows.filter((_: any, index: number) => selectedItems.has(index))
    
    if (selectedData.length === 0) return

    // Pegar a venda do primeiro item (todos são da mesma venda)
    const saleId = selectedData[0].sale_id
    const sale = monthlyData.saleMap[`${saleId}-${selectedData[0].id.split('-')[1]}`]
    
    if (!sale) {
      alert("Erro ao carregar dados da venda")
      return
    }

    // Buscar dados completos do cliente
    let customerData: Customer | null = null
    if (sale.customer) {
      try {
        customerData = await customersApi.getById(sale.customer)
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error)
      }
    }

    // Calcular totais dos itens selecionados
    const subtotal = selectedData.reduce((acc, row) => acc + Number(row.total_price), 0)

    // Preparar dados para o PDF
    const pdfData = selectedData.map(row => ({
      "Nome": row.product_name,
      "Quantidade": row.quantity.toString(),
      "Unidade": "un",
      "Valor Unitário": `R$ ${Number(row.unit_price).toFixed(2)}`,
      "Valor Total": `R$ ${Number(row.total_price).toFixed(2)}`,
    }))

    // Adicionar linha de Total Produtos
    pdfData.push({
      "Nome": "",
      "Quantidade": "",
      "Unidade": "",
      "Valor Unitário": "Total Produtos",
      "Valor Total": `R$ ${subtotal.toFixed(2)}`,
    })

    // Montar endereço completo
    const address = [company.street, company.number, company.neighborhood].filter(Boolean).join(", ")
    const city = [company.city, company.state].filter(Boolean).join("/")

    // Corrigir problema de timezone na data - usar split para evitar conversão UTC
    const [year, month, day] = sale.sale_date.split('-')
    const formattedDate = `${day}/${month}/${year}`

    generatePDF({
      reportType: "Pedido de Venda",
      reportNumber: sale.sale_number,
      reportDate: formattedDate,
      companyInfo: {
        name: company.nome_fantasia,
        cnpj: company.cnpj,
        address: address,
        city: city,
        phone: company.phone,
        email: company.email,
        contact: company.responsavel || undefined,
      },
      clientInfo: customerData ? {
        name: customerData.name,
        address: customerData.address || undefined,
        neighborhood: customerData.neighborhood || undefined,
        city: customerData.city || undefined,
        state: customerData.state || undefined,
      } : {
        name: sale.customer_name || "Cliente não informado",
      },
      columns: [
        { text: "Nome", width: "*" },
        { text: "Quantidade", width: 80, alignment: "center" },
        { text: "Unidade", width: 60, alignment: "center" },
        { text: "Valor Unitário", width: 90, alignment: "right" },
        { text: "Valor Total", width: 90, alignment: "right" },
      ],
      data: pdfData,
      totals: [
        { label: "Subtotal", value: `R$ ${subtotal.toFixed(2)}` },
      ],
      orientation: "portrait",
    })
  }

  // Filtra vendas por período e expande os itens
  const monthlyData = useMemo(() => {
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date)
      const [year, month] = selectedMonth.split('-')
      const saleYear = saleDate.getFullYear()
      const saleMonth = saleDate.getMonth() + 1
      
      const matchesDate = saleYear === parseInt(year) && saleMonth === parseInt(month)
      
      // Se nenhum status selecionado, mostra todos
      const matchesStatus = selectedStatuses.size === 0 || selectedStatuses.has(sale.status)
      
      return matchesDate && matchesStatus
    })

    // Ordena vendas por data (mais recentes primeiro)
    const sortedSales = [...filteredSales].sort((a, b) => {
      const dateA = new Date(a.sale_date)
      const dateB = new Date(b.sale_date)
      return dateB.getTime() - dateA.getTime()
    })

    // Expande cada venda em linhas por item
    const rows: any[] = []
    const saleMap: Record<string, Sale> = {}
    const totals = {
      quantity: 0,
      unit_price: 0,
      total_price: 0,
      unit_cost: 0,
      total_cost: 0,
      profit: 0,
    }

    sortedSales.forEach(sale => {
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach(item => {
          const rowId = `${sale.id}-${item.id}`
          const totalCost = Number(item.unit_cost) * Number(item.quantity)
          
          rows.push({
            id: rowId,
            sale_id: sale.id,
            sale_number: sale.sale_number,
            sale_date: sale.sale_date,
            customer_state: sale.customer_state || "",
            sale_type: sale.sale_type || "venda",
            customer_name: sale.customer_name || "Cliente não informado",
            product_name: item.product_name || "",
            nf: sale.nf || "",
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            unit_cost: item.unit_cost,
            total_cost: totalCost,
            profit: item.profit,
            status: sale.status,
          })
          totals.quantity += Number(item.quantity)
          totals.unit_price += Number(item.unit_price)
          totals.total_price += Number(item.total_price)
          totals.unit_cost += Number(item.unit_cost)
          totals.total_cost += Number(totalCost)
          totals.profit += Number(item.profit)
          saleMap[rowId] = sale
        })
      }
    })

    return { rows, totals, saleMap }
  }, [sales, selectedMonth, selectedStatuses])

  const statusOptions = [
    { value: 'disputa', label: 'Disputa' },
    { value: 'aguardando_julgamento', label: 'Aguardando Julgamento' },
    { value: 'homologado', label: 'Homologado' },
    { value: 'em_producao', label: 'Em Produção' },
    { value: 'em_transito', label: 'Em Trânsito' },
    { value: 'aguardando_pagamento', label: 'Aguardando Pagamento' },
    { value: 'liquidado', label: 'Liquidado' },
  ]

  // Verifica se todos os itens selecionados são da mesma venda
  const canGenerateProposal = useMemo(() => {
    if (selectedItems.size === 0) return false
    
    const selectedSaleIds = new Set<number>()
    selectedItems.forEach((index: number) => {
      const row = monthlyData.rows[index]
      if (row) {
        selectedSaleIds.add(row.sale_id)
      }
    })
    
    return selectedSaleIds.size === 1
  }, [selectedItems, monthlyData.rows])

  return (
    <ErpWindow title={`Resumo Mensal`}>
      <div className="space-y-2 mb-2">
        <div className="flex gap-2 mb-2 items-center">
          <label className="text-[11px]">Mês:</label>
          <input
            type="month"
            className="erp-input w-40"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <span className="text-[11px] ml-4">
            Total de itens: {monthlyData.rows.length}
          </span>
        </div>
        
        <div className="flex gap-2 items-center flex-wrap">
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
              ✕ Limpar Filtros
            </button>
          )}
          <button
            className={`erp-button !min-w-0 !px-2 !py-1 !text-[10px] ml-auto ${
              !canGenerateProposal ? '!bg-gray-300 !cursor-not-allowed' : ''
            }`}
            onClick={() => canGenerateProposal && handleGenerateProposal(monthlyData)}
            disabled={!canGenerateProposal}
          >
            📄 Proposta de Venda
          </button>
        </div>
      </div>

      <DataGrid
        maxHeight="400px"
        columns={[
          {
            key: "checkbox",
            header: "✓",
            width: "30px",
            render: (item: any, index?: number) => (
              <input
                type="checkbox"
                checked={selectedItems.has(index!)}
                onChange={() => toggleSelectItem(index!)}
              />
            ),
          },
          { key: "sale_number", header: "Venda", width: "100px", align: "center" },
          {
            key: "sale_date",
            header: "Data",
            width: "100px",
            align: "center",
            render: (item) => {
              // Evita problema de timezone ao converter string de data
              const [year, month, day] = item.sale_date.split('-')
              return `${day}/${month}/${year}`
            },
          },
          { key: "customer_state", header: "UF", width: "50px", align: "center" },
          {
            key: "sale_type",
            header: "Tipo",
            width: "80px",
            align: "center",
            render: (item) => {
              const typeMap: Record<string, string> = {
                venda: "Venda",
                dispensa: "Dispensa",
                pregao: "Pregão",
              }
              return typeMap[item.sale_type] || item.sale_type
            },
          },
          { key: "customer_name", header: "Cliente", width: "150px" },
          { key: "product_name", header: "Produto", width: "150px" },
          { key: "nf", header: "NF", width: "100px", align: "center" },
          {
            key: "quantity",
            header: "Quant.",
            width: "80px",
            align: "center",
            render: (item) => Math.round(Number(item.quantity)).toString(),
          },
          {
            key: "unit_price",
            header: "Valor Unit.",
            width: "90px",
            align: "left",
            render: (item) => `R$ ${Number(item.unit_price).toFixed(2)}`,
          },
          {
            key: "total_price",
            header: "Valor Total",
            width: "100px",
            align: "left",
            render: (item) => `R$ ${Number(item.total_price).toFixed(2)}`,
          },
          {
            key: "unit_cost",
            header: "Custo Unit.",
            width: "90px",
            align: "left",
            render: (item) => `R$ ${Number(item.unit_cost).toFixed(2)}`,
          },
          {
            key: "total_cost",
            header: "Custo Total",
            width: "100px",
            align: "left",
            render: (item) => `R$ ${Number(item.total_cost).toFixed(2)}`,
          },
          {
            key: "profit",
            header: "Lucro",
            width: "100px",
            align: "left",
            render: (item) => `R$ ${Number(item.profit).toFixed(2)}`,
          },
          {
            key: "status",
            header: "Status",
            width: "120px",
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
              const status = statusMap[item.status] || { label: item.status, color: "yellow" as const }
              return (
                <StatusBadge color={status.color}>
                  {status.label}
                </StatusBadge>
              )
            },
          },
        ]}
        data={monthlyData.rows}
        selectedIndex={selectedRowIndex}
        onRowClick={(row: any, index?: number) => {
          setSelectedRowIndex(index)
          if (onSaleSelect) {
            const sale = monthlyData.saleMap[row.id]
            if (sale) {
              onSaleSelect(sale)
            }
          }
        }}
      />

      <div className="mt-2 text-[11px] erp-inset p-2">
        <div className="font-bold mb-1">Resumo {'>>'}</div>
        <div className="grid grid-cols-6 gap-2">
          <div>
            <span className="font-bold">Quan.:</span> {monthlyData.totals.quantity.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">V. Unit.:</span> R$ {monthlyData.totals.unit_price.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">V. Total.:</span> R$ {monthlyData.totals.total_price.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">C. Unit.:</span> R$ {monthlyData.totals.unit_cost.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">C. Total:</span> R$ {monthlyData.totals.total_cost.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">Lucro:</span> R$ {monthlyData.totals.profit.toFixed(2)}
          </div>
        </div>
      </div>
    </ErpWindow>
  )
}
