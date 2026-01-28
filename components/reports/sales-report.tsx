"use client"

import { useState, useEffect, useMemo } from "react"
import { DataGrid } from "@/components/erp/data-grid"
import { salesApi, companyApi } from "@/lib/api"
import type { Sale, Company } from "@/lib/types"
import { generatePDF } from "@/lib/utils/pdf-generator"

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
    return date.toISOString().split('T')[0]
  })
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

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

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      return saleDate >= start && saleDate <= end
    })
  }, [sales, startDate, endDate])

  const expandedData = useMemo(() => {
    const rows: any[] = []
    filteredSales.forEach(sale => {
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach(item => {
          const calculatedTax = (Number(item.total_price) * Number(sale.tax_percentage || 0)) / 100
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
            total_price: item.total_price,
            unit_cost: item.unit_cost,
            total_cost: Number(item.unit_cost) * Number(item.quantity),
            tax: calculatedTax,
            freight: item.freight,
            profit: item.profit,
          })
        })
      }
    })
    return rows
  }, [filteredSales])

  const totals = useMemo(() => {
    const rowCount = expandedData.length
    const sums = expandedData.reduce((acc, row) => ({
      quantity: acc.quantity + Number(row.quantity),
      total_price: acc.total_price + Number(row.total_price),
      total_cost: acc.total_cost + Number(row.total_cost),
      tax: acc.tax + Number(row.tax),
      freight: acc.freight + Number(row.freight),
      profit: acc.profit + Number(row.profit),
    }), {
      quantity: 0,
      total_price: 0,
      total_cost: 0,
      tax: 0,
      freight: 0,
      profit: 0,
    })
    return sums
  }, [expandedData])

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

    // Filtrar apenas os itens selecionados
    const selectedData = expandedData.filter((_, index) => selectedItems.has(index))

    // Calcular totais dos itens selecionados
    const selectedTotals = selectedData.reduce((acc, row) => ({
      quantity: acc.quantity + Number(row.quantity),
      total_price: acc.total_price + Number(row.total_price),
      total_cost: acc.total_cost + Number(row.total_cost),
      tax: acc.tax + Number(row.tax),
      freight: acc.freight + Number(row.freight),
      profit: acc.profit + Number(row.profit),
    }), {
      quantity: 0,
      total_price: 0,
      total_cost: 0,
      tax: 0,
      freight: 0,
      profit: 0,
    })

    // Preparar dados para o PDF
    const pdfData = selectedData.map(row => ({
      "Venda": row.sale_number,
      "Data": new Date(row.sale_date).toLocaleDateString('pt-BR'),
      "UF": row.customer_state,
      "Cliente": row.customer_name,
      "Produto": row.product_name,
      "Quantidade": row.quantity.toString(),
      "Valor Unitário": `R$ ${Number(row.unit_price).toFixed(2)}`,
      "Valor Total": `R$ ${Number(row.total_price).toFixed(2)}`,
      "Custo Total": `R$ ${Number(row.total_cost).toFixed(2)}`,
      "Imposto": `R$ ${Number(row.tax).toFixed(2)}`,
      "Frete": `R$ ${Number(row.freight).toFixed(2)}`,
      "Lucro": `R$ ${Number(row.profit).toFixed(2)}`,
    }))

    // Montar endereço completo
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
        { text: "Venda", width: 50 },
        { text: "Data", width: 55 },
        { text: "UF", width: 30 },
        { text: "Cliente", width: 70 },
        { text: "Produto", width: 80 },
        { text: "Quantidade", width: 50, alignment: "right" },
        { text: "Valor Unitário", width: 55, alignment: "right" },
        { text: "Valor Total", width: 55, alignment: "right" },
        { text: "Custo Total", width: 55, alignment: "right" },
        { text: "Imposto", width: 50, alignment: "right" },
        { text: "Frete", width: 45, alignment: "right" },
        { text: "Lucro", width: 50, alignment: "right" },
      ],
      data: pdfData,
      observations: `Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`,
      orientation: "landscape",
    })
  }

  if (loading) {
    return <div className="text-[11px] p-2">Carregando vendas...</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center mb-2">
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
          checked={selectedItems.size === expandedData.length && expandedData.length > 0}
          onChange={toggleSelectAll}
        />
        <label className="text-[11px]">Selecionar Todos ({selectedItems.size} de {expandedData.length})</label>
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
          { key: "sale_number", header: "Venda", width: "100px" },
          {
            key: "sale_date",
            header: "Data",
            width: "100px",
            render: (item) => new Date(item.sale_date).toLocaleDateString('pt-BR'),
          },
          { key: "customer_state", header: "UF", width: "50px" },
          { key: "customer_name", header: "Cliente", width: "150px" },
          { key: "product_name", header: "Produto", width: "150px" },
          {
            key: "quantity",
            header: "Quantidade",
            width: "80px",
            align: "right",
          },
          {
            key: "unit_price",
            header: "Valor Uni.",
            width: "90px",
            align: "right",
            render: (item) => `R$ ${Number(item.unit_price).toFixed(2)}`,
          },
          {
            key: "total_price",
            header: "Valor Total",
            width: "100px",
            align: "right",
            render: (item) => `R$ ${Number(item.total_price).toFixed(2)}`,
          },
          {
            key: "total_cost",
            header: "C. Total",
            width: "100px",
            align: "right",
            render: (item) => `R$ ${Number(item.total_cost).toFixed(2)}`,
          },
          {
            key: "tax",
            header: "Imposto",
            width: "90px",
            align: "right",
            render: (item) => `R$ ${Number(item.tax).toFixed(2)}`,
          },
          {
            key: "freight",
            header: "Frete",
            width: "80px",
            align: "right",
            render: (item) => `R$ ${Number(item.freight).toFixed(2)}`,
          },
          {
            key: "profit",
            header: "Lucro",
            width: "100px",
            align: "right",
            render: (item) => `R$ ${Number(item.profit).toFixed(2)}`,
          },
        ]}
        data={expandedData}
        onRowClick={() => {}}
      />

      <div className="mt-2 text-[11px] erp-inset p-2">
        <div className="font-bold mb-1">Totais do Período:</div>
        <div className="grid grid-cols-6 gap-2">
          <div>
            <span className="font-bold">Quantidade:</span> {totals.quantity}
          </div>
          <div>
            <span className="font-bold">V. Total:</span> R$ {totals.total_price.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">C. Total:</span> R$ {totals.total_cost.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">Imposto:</span> R$ {totals.tax.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">Frete:</span> R$ {totals.freight.toFixed(2)}
          </div>
          <div>
            <span className="font-bold">Lucro:</span> R$ {totals.profit.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}
