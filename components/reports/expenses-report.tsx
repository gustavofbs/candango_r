"use client"

import { useState, useEffect, useMemo } from "react"
import { DataGrid } from "@/components/erp/data-grid"
import { StatusBadge } from "@/components/erp/status-badge"
import { expensesApi, companyApi } from "@/lib/api"
import type { Expense, Company } from "@/lib/types"
import { generatePDF } from "@/lib/utils/pdf-generator"

export function ExpensesReport() {
  const [expenses, setExpenses] = useState<Expense[]>([])
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
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([loadExpenses(), loadCompany()])
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

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const data = await expensesApi.getAll()
      setExpenses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao carregar despesas:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleType = (type: string) => {
    const newTypes = new Set(selectedTypes)
    if (newTypes.has(type)) {
      newTypes.delete(type)
    } else {
      newTypes.add(type)
    }
    setSelectedTypes(newTypes)
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const [ey, em, ed] = expense.date.split('-').map(Number)
      const [sy, sm, sd] = startDate.split('-').map(Number)
      const [fy, fm, fd] = endDate.split('-').map(Number)
      const expNum = ey * 10000 + em * 100 + ed
      const startNum = sy * 10000 + sm * 100 + sd
      const endNum = fy * 10000 + fm * 100 + fd
      const matchesDate = expNum >= startNum && expNum <= endNum
      const matchesType = selectedTypes.size === 0 || selectedTypes.has(expense.expense_type)
      return matchesDate && matchesType
    })
  }, [expenses, startDate, endDate, selectedTypes])

  const summary = useMemo(() => {
    const rows = selectedItems.size > 0
      ? filteredExpenses.filter((_, idx) => selectedItems.has(idx))
      : filteredExpenses
    const totalFixed = rows.filter(e => e.expense_type === 'FIXO').reduce((s, e) => s + Number(e.amount), 0)
    const totalVariable = rows.filter(e => e.expense_type === 'VARIAVEL').reduce((s, e) => s + Number(e.amount), 0)
    return {
      count: rows.length,
      totalFixed,
      totalVariable,
      total: totalFixed + totalVariable,
      is_selection: selectedItems.size > 0,
    }
  }, [filteredExpenses, selectedItems])

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredExpenses.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredExpenses.map((_, idx) => idx)))
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

    const selectedData = filteredExpenses.filter((_, index) => selectedItems.has(index))

    const pdfTotals = selectedData.reduce(
      (acc, row) => ({ total: acc.total + Number(row.amount) }),
      { total: 0 }
    )

    const pdfFooterRow: Record<string, string> = {
      "Data": "TOTAIS",
      "Nome da Despesa": "",
      "Tipo": "",
      "Valor": `R$ ${pdfTotals.total.toFixed(2)}`,
      "Status": "",
    }

    const pdfData = selectedData.map(row => ({
      "Data": (() => { const [y, m, d] = row.date.split('-'); return `${d}/${m}/${y}` })(),
      "Nome da Despesa": row.name,
      "Tipo": row.expense_type === 'FIXO' ? 'Fixo' : 'Variável',
      "Valor": `R$ ${Number(row.amount).toFixed(2)}`,
      "Status": row.active ? 'Ativo' : 'Inativo',
    }))

    const address = [company.street, company.number, company.neighborhood].filter(Boolean).join(", ")
    const city = [company.city, company.state].filter(Boolean).join("/")

    generatePDF({
      reportType: "Relatório de Despesas",
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
        { text: "Data", width: 60 },
        { text: "Nome da Despesa", width: "*" },
        { text: "Tipo", width: 70, alignment: "center" },
        { text: "Valor", width: 80, alignment: "right" },
        { text: "Status", width: 60, alignment: "center" },
      ],
      data: pdfData,
      footerRow: pdfFooterRow,
      observations: `Período: ${startDate.split('-').reverse().join('/')} a ${endDate.split('-').reverse().join('/')}`,
    })
  }

  if (loading) {
    return <div className="text-[11px] p-2">Carregando despesas...</div>
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
        <label className="text-[11px]">Filtrar por Tipo:</label>
        {[{ value: 'FIXO', label: 'Fixo' }, { value: 'VARIAVEL', label: 'Variável' }].map(type => (
          <button
            key={type.value}
            className={`erp-button !min-w-0 !px-2 !py-1 !text-[10px] ${
              selectedTypes.has(type.value) ? '!bg-blue-200' : ''
            }`}
            onClick={() => toggleType(type.value)}
          >
            {selectedTypes.has(type.value) ? '✓ ' : ''}{type.label}
          </button>
        ))}
        {selectedTypes.size > 0 && (
          <button
            className="erp-button !min-w-0 !px-2 !py-1 !text-[10px]"
            onClick={() => setSelectedTypes(new Set())}
          >
            ✕ Limpar
          </button>
        )}
      </div>

      <div className="flex gap-2 items-center mb-2">
        <input
          type="checkbox"
          checked={selectedItems.size === filteredExpenses.length && filteredExpenses.length > 0}
          onChange={toggleSelectAll}
        />
        <label className="text-[11px]">Selecionar Todos ({selectedItems.size} de {filteredExpenses.length})</label>
      </div>

      <DataGrid
        maxHeight="300px"
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
          {
            key: "date",
            header: "Data",
            width: "90px",
            render: (item) => {
              const [y, m, d] = item.date.split('-')
              return `${d}/${m}/${y}`
            },
          },
          { key: "name", header: "Nome da Despesa" },
          {
            key: "expense_type",
            header: "Tipo",
            width: "90px",
            align: "center",
            render: (item) => (
              <StatusBadge color={item.expense_type === "FIXO" ? "green" : "yellow"}>
                {item.expense_type === "FIXO" ? "FIXO" : "VARIÁVEL"}
              </StatusBadge>
            ),
          },
          {
            key: "amount",
            header: "Valor",
            width: "100px",
            align: "right",
            render: (item) => `R$ ${Number(item.amount).toFixed(2)}`,
          },
          {
            key: "active",
            header: "Status",
            width: "75px",
            align: "center",
            render: (item) => (
              <StatusBadge color={item.active ? "green" : "red"}>
                {item.active ? "ATIVO" : "INATIVO"}
              </StatusBadge>
            ),
          },
        ]}
        data={filteredExpenses}
        onRowClick={() => {}}
      />

      <div className="mt-2 text-[11px] erp-inset p-2">
        <div className="font-bold mb-1">
          Resumo {'>>'}{summary.is_selection && <span className="font-normal text-[10px] ml-1 text-blue-700">(seleção: {selectedItems.size} itens)</span>}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div><span className="font-bold">Registros:</span> {summary.count}</div>
          <div><span className="font-bold">Fixas:</span> R$ {summary.totalFixed.toFixed(2)}</div>
          <div><span className="font-bold">Variáveis:</span> R$ {summary.totalVariable.toFixed(2)}</div>
          <div><span className="font-bold">Total:</span> R$ {summary.total.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}
