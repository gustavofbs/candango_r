"use client"

import { useState, useMemo, useEffect } from "react"
import { ErpWindow } from "@/components/erp/window"
import { StatusBadge } from "@/components/erp/status-badge"
import type { Sale, Customer } from "@/lib/types"
import { companyApi, customersApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import type { Company } from "@/lib/types"
import { generatePDF } from "@/lib/utils/pdf-generator"

interface MonthlySummaryProps {
  sales: Sale[]
  selectedSaleId?: number
  onSaleSelect?: (sale: Sale) => void
}

const TYPE_MAP: Record<string, string> = {
  venda: "Venda",
  dispensa: "Dispensa",
  pregao: "Pregão",
  uniforme: "Uniforme",
}

const STATUS_MAP: Record<string, { label: string; color: "green" | "yellow" | "cyan" | "orange" | "red" }> = {
  disputa: { label: "Disputa", color: "red" },
  aguardando_julgamento: { label: "Aguard Julg", color: "red" },
  homologado: { label: "Homologado", color: "yellow" },
  em_producao: { label: "Em Produção", color: "cyan" },
  em_transito: { label: "Em Trânsito", color: "cyan" },
  aguardando_pagamento: { label: "Aguard Pag", color: "orange" },
  liquidado: { label: "Liquidado", color: "green" },
}

const fmt = (n: number) => `R$ ${n.toFixed(2)}`

export function MonthlySummary({ sales, selectedSaleId, onSaleSelect }: MonthlySummaryProps) {
  const { user } = useAuth()
  const isAdmin = user?.is_staff ?? false
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  })
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set())
  const [selectedSales, setSelectedSales] = useState<Set<number>>(new Set())
  const [expandedSales, setExpandedSales] = useState<Set<number>>(new Set())
  const [activeSaleId, setActiveSaleId] = useState<number | undefined>(selectedSaleId)
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
    const next = new Set(selectedStatuses)
    if (next.has(status)) next.delete(status)
    else next.add(status)
    setSelectedStatuses(next)
  }

  const toggleSelectSale = (index: number) => {
    const next = new Set(selectedSales)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setSelectedSales(next)
  }

  const toggleExpand = (saleId: number) => {
    const next = new Set(expandedSales)
    if (next.has(saleId)) next.delete(saleId)
    else next.add(saleId)
    setExpandedSales(next)
  }

  const monthlyData = useMemo(() => {
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date)
      const [year, month] = selectedMonth.split('-')
      const matchesDate =
        saleDate.getFullYear() === parseInt(year) &&
        saleDate.getMonth() + 1 === parseInt(month)
      const matchesStatus = selectedStatuses.size === 0 || selectedStatuses.has(sale.status)
      return matchesDate && matchesStatus
    })

    const sortedSales = [...filteredSales].sort((a, b) =>
      new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
    )

    const saleRows = sortedSales.map(sale => {
      const items = (sale.items || []).map((item: any) => ({
        id: item.id,
        product_name: item.product_name || "",
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
        unit_cost: Number(item.unit_cost),
        total_cost: Number(item.unit_cost) * Number(item.quantity),
        profit: Number(item.profit),
        item_status: item.item_status || 'pendente',
      }))

      const total_price = items.reduce((s: number, i: any) => s + i.total_price, 0)
      const total_cost = items.reduce((s: number, i: any) => s + i.total_cost, 0)
      const total_profit = items.reduce((s: number, i: any) => s + i.profit, 0)
      const total_quantity = items.reduce((s: number, i: any) => s + i.quantity, 0)

      return {
        id: sale.id,
        sale_number: sale.sale_number,
        sale_date: sale.sale_date,
        customer_state: sale.customer_state || "",
        sale_type: sale.sale_type || "venda",
        customer_name: sale.customer_name || "Cliente não informado",
        nf: sale.nf || "",
        total_quantity,
        unit_price: items.length === 1 ? items[0].unit_price : null,
        total_price,
        unit_cost: items.length === 1 ? items[0].unit_cost : null,
        total_cost,
        total_profit,
        status: sale.status,
        item_count: items.length,
        items,
        _sale: sale,
      }
    })

    let unitPriceSum = 0
    let unitCostSum = 0
    let itemCount = 0
    saleRows.forEach(r => {
      r.items.forEach((i: any) => {
        unitPriceSum += i.unit_price
        unitCostSum += i.unit_cost
        itemCount += 1
      })
    })

    const totals = {
      total_price: saleRows.reduce((s, r) => s + r.total_price, 0),
      total_cost: saleRows.reduce((s, r) => s + r.total_cost, 0),
      total_profit: saleRows.reduce((s, r) => s + r.total_profit, 0),
      sale_count: saleRows.length,
      avg_unit_price: itemCount > 0 ? unitPriceSum / itemCount : 0,
      avg_unit_cost: itemCount > 0 ? unitCostSum / itemCount : 0,
    }

    return { saleRows, totals }
  }, [sales, selectedMonth, selectedStatuses])

  const canGenerateProposal = selectedSales.size === 1

  const handleGenerateProposal = async () => {
    if (!canGenerateProposal) return
    if (!company) {
      alert("Dados da empresa não encontrados. Cadastre a empresa primeiro.")
      return
    }

    const [saleIndex] = [...selectedSales]
    const saleRow = monthlyData.saleRows[saleIndex]
    if (!saleRow) return

    const sale = saleRow._sale
    let customerData: Customer | null = null
    if (sale.customer) {
      try {
        customerData = await customersApi.getById(sale.customer)
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error)
      }
    }

    const pdfData = saleRow.items.map((item: any) => ({
      "Nome": item.product_name,
      "Quantidade": Math.round(item.quantity).toString(),
      "Unidade": "un",
      "Valor Unitário": `R$ ${item.unit_price.toFixed(2)}`,
      "Valor Total": `R$ ${item.total_price.toFixed(2)}`,
    }))
    pdfData.push({
      "Nome": "",
      "Quantidade": "",
      "Unidade": "",
      "Valor Unitário": "Total Produtos",
      "Valor Total": `R$ ${saleRow.total_price.toFixed(2)}`,
    })

    const address = [company.street, company.number, company.neighborhood].filter(Boolean).join(", ")
    const city = [company.city, company.state].filter(Boolean).join("/")
    const [yr, mo, dy] = sale.sale_date.split('-')

    generatePDF({
      reportType: "Pedido de Venda",
      reportNumber: sale.sale_number,
      reportDate: `${dy}/${mo}/${yr}`,
      companyInfo: {
        name: company.nome_fantasia,
        cnpj: company.cnpj,
        address,
        city,
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
      totals: [{ label: "Subtotal", value: `R$ ${saleRow.total_price.toFixed(2)}` }],
      orientation: "portrait",
    })
  }

  const statusOptions = [
    { value: 'disputa', label: 'Disputa' },
    { value: 'aguardando_julgamento', label: 'Aguardando Julgamento' },
    { value: 'homologado', label: 'Homologado' },
    { value: 'em_producao', label: 'Em Produção' },
    { value: 'em_transito', label: 'Em Trânsito' },
    { value: 'aguardando_pagamento', label: 'Aguardando Pagamento' },
    { value: 'liquidado', label: 'Liquidado' },
  ]

  return (
    <ErpWindow title="Resumo Mensal">
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
            Total de vendas: {monthlyData.totals.sale_count}
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
            onClick={handleGenerateProposal}
            disabled={!canGenerateProposal}
          >
            📄 Proposta de Venda
          </button>
        </div>
      </div>

      <div className="erp-inset overflow-auto" style={{ maxHeight: "400px" }}>
        <table className="erp-table">
          <thead>
            <tr>
              <th style={{ width: "28px" }} className="sticky top-0 bg-[#d4d0c8] z-10"></th>
              <th style={{ width: "28px" }} className="sticky top-0 bg-[#d4d0c8] z-10">✓</th>
              <th style={{ width: "90px" }} className="sticky top-0 bg-[#d4d0c8] z-10">Venda</th>
              <th style={{ width: "88px", textAlign: "center" }} className="sticky top-0 bg-[#d4d0c8] z-10">Data</th>
              <th style={{ width: "38px", textAlign: "center" }} className="sticky top-0 bg-[#d4d0c8] z-10">UF</th>
              <th style={{ width: "70px", textAlign: "center" }} className="sticky top-0 bg-[#d4d0c8] z-10">Tipo</th>
              <th style={{ width: "150px" }} className="sticky top-0 bg-[#d4d0c8] z-10">Cliente</th>
              <th style={{ width: "85px", textAlign: "center" }} className="sticky top-0 bg-[#d4d0c8] z-10">NF</th>
              <th style={{ width: "62px", textAlign: "center" }} className="sticky top-0 bg-[#d4d0c8] z-10">Quant.</th>
              <th style={{ width: "85px", textAlign: "right" }} className="sticky top-0 bg-[#d4d0c8] z-10">V. Unit.</th>
              <th style={{ width: "95px", textAlign: "right" }} className="sticky top-0 bg-[#d4d0c8] z-10">Valor Total</th>
              {isAdmin && <th style={{ width: "85px", textAlign: "right" }} className="sticky top-0 bg-[#d4d0c8] z-10">C. Unit.</th>}
              {isAdmin && <th style={{ width: "95px", textAlign: "right" }} className="sticky top-0 bg-[#d4d0c8] z-10">Custo Total</th>}
              {isAdmin && <th style={{ width: "95px", textAlign: "right" }} className="sticky top-0 bg-[#d4d0c8] z-10">Lucro</th>}
              <th style={{ width: "110px", textAlign: "center" }} className="sticky top-0 bg-[#d4d0c8] z-10">Status</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.saleRows.length === 0 ? (
              <tr>
                <td colSpan={15} className="text-center py-4 !bg-white">
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              monthlyData.saleRows.flatMap((row, rowIndex) => {
                const isExpanded = expandedSales.has(row.id)
                const isActive = activeSaleId === row.id
                const isChecked = selectedSales.has(rowIndex)
                const [yr, mo, dy] = row.sale_date.split('-')
                const status = STATUS_MAP[row.status] || { label: row.status, color: "yellow" as const }

                const saleRow = (
                  <tr
                    key={`sale-${row.id}`}
                    className={`cursor-pointer hover:!bg-[#000080] hover:!text-white ${
                      isActive ? "!bg-[#000080] !text-white" : ""
                    }`}
                    onClick={() => {
                      setActiveSaleId(row.id)
                      onSaleSelect?.(row._sale)
                    }}
                  >
                    <td style={{ textAlign: "center", padding: "1px 2px" }}>
                      <button
                        className={`text-[10px] font-bold leading-none select-none ${
                          isActive ? "text-white" : "text-gray-500"
                        }`}
                        onClick={(e) => { e.stopPropagation(); toggleExpand(row.id) }}
                        title={isExpanded ? "Recolher itens" : "Ver itens"}
                      >
                        {isExpanded ? "▼" : "▶"}
                      </button>
                    </td>
                    <td style={{ padding: "1px 4px" }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectSale(rowIndex)}
                      />
                    </td>
                    <td>
                      <span className="font-semibold">{row.sale_number}</span>
                      {row.item_count > 1 && (
                        <span
                          className={`ml-1 text-[9px] px-1 py-0 rounded-full font-bold align-middle ${
                            isActive ? "bg-white text-[#000080]" : "bg-[#000080] text-white"
                          }`}
                          title={`${row.item_count} itens`}
                        >
                          {row.item_count}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>{`${dy}/${mo}/${yr}`}</td>
                    <td style={{ textAlign: "center" }}>{row.customer_state}</td>
                    <td style={{ textAlign: "center" }}>{TYPE_MAP[row.sale_type] || row.sale_type}</td>
                    <td>{row.customer_name}</td>
                    <td style={{ textAlign: "center" }}>{row.nf}</td>
                    <td style={{ textAlign: "center" }}>{Math.round(row.total_quantity)}</td>
                    <td style={{ textAlign: "right" }}>
                      {row.unit_price !== null
                        ? fmt(row.unit_price)
                        : <span style={{ color: "#888", fontStyle: "italic" }} title="Múltiplos itens — expanda para ver">≈</span>}
                    </td>
                    <td style={{ textAlign: "right" }}>{fmt(row.total_price)}</td>
                    {isAdmin && (
                      <td style={{ textAlign: "right" }}>
                        {row.unit_cost !== null
                          ? fmt(row.unit_cost)
                          : <span style={{ color: "#888", fontStyle: "italic" }} title="Múltiplos itens — expanda para ver">≈</span>}
                      </td>
                    )}
                    {isAdmin && <td style={{ textAlign: "right" }}>{fmt(row.total_cost)}</td>}
                    {isAdmin && <td style={{ textAlign: "right" }}>{fmt(row.total_profit)}</td>}
                    <td style={{ textAlign: "center" }}>
                      <StatusBadge color={status.color}>{status.label}</StatusBadge>
                    </td>
                  </tr>
                )

                const itemRows = isExpanded
                  ? row.items.map((item: any) => (
                      <tr
                        key={`item-${item.id}`}
                        className="cursor-pointer hover:!bg-[#4060b0] hover:!text-white"
                        style={{ backgroundColor: "#eeeae4" }}
                        onClick={() => { setActiveSaleId(row.id); onSaleSelect?.(row._sale) }}
                      >
                        <td></td>
                        <td></td>
                        <td colSpan={6} className="text-[11px]" style={{ paddingLeft: "18px" }}>
                          <span className="text-gray-400 mr-1">↳</span>
                          {item.product_name}
                          {row.sale_type === 'uniforme' && (
                            <span className={`ml-2 px-1 py-0 text-[9px] rounded font-bold ${
                              item.item_status === 'entregue'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.item_status === 'entregue' ? '✅ Entregue' : '⏳ Pendente'}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }} className="text-[11px]">
                          {Math.round(item.quantity)}
                        </td>
                        <td style={{ textAlign: "right" }} className="text-[11px]">{fmt(item.unit_price)}</td>
                        <td style={{ textAlign: "right" }} className="text-[11px]">{fmt(item.total_price)}</td>
                        {isAdmin && <td style={{ textAlign: "right" }} className="text-[11px]">{fmt(item.unit_cost)}</td>}
                        {isAdmin && <td style={{ textAlign: "right" }} className="text-[11px]">{fmt(item.total_cost)}</td>}
                        {isAdmin && <td style={{ textAlign: "right" }} className="text-[11px]">{fmt(item.profit)}</td>}
                        <td></td>
                      </tr>
                    ))
                  : []

                return [saleRow, ...itemRows]
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-[11px] erp-inset p-2">
        <div className="font-bold mb-1">Resumo {'>>'}</div>
        <div className="grid grid-cols-6 gap-2">
          <div><span className="font-bold">Vendas:</span> {monthlyData.totals.sale_count}</div>
          <div><span className="font-bold">V. Unit.:</span> {fmt(monthlyData.totals.avg_unit_price)}</div>
          <div><span className="font-bold">V. Total:</span> {fmt(monthlyData.totals.total_price)}</div>
          {isAdmin && <div><span className="font-bold">C. Unit.:</span> {fmt(monthlyData.totals.avg_unit_cost)}</div>}
          {isAdmin && <div><span className="font-bold">C. Total:</span> {fmt(monthlyData.totals.total_cost)}</div>}
          {isAdmin && <div><span className="font-bold">Lucro:</span> {fmt(monthlyData.totals.total_profit)}</div>}
        </div>
      </div>
    </ErpWindow>
  )
}
