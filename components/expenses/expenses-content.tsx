"use client"

import { useState, useMemo } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { Toolbar } from "@/components/erp/toolbar"
import { StatusBadge } from "@/components/erp/status-badge"
import { ExpenseForm } from "@/components/expenses/expense-form"
import type { Expense } from "@/lib/types"
import { expensesApi } from "@/lib/api"

interface ExpensesContentProps {
  initialExpenses: Expense[]
}

export function ExpensesContent({ initialExpenses }: ExpensesContentProps) {
  const [expenses, setExpenses] = useState(Array.isArray(initialExpenses) ? initialExpenses : [])
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState("")
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(1)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const date = new Date()
    return date.toISOString().split('T')[0]
  })

  const refreshExpenses = async () => {
    try {
      const data = await expensesApi.getAll()
      setExpenses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao atualizar despesas:", error)
    }
  }

  const handleNew = () => {
    setSelectedExpense(null)
    setShowForm(true)
  }

  const handleEdit = () => {
    if (selectedExpense) {
      setShowForm(true)
    }
  }

  const handleDelete = async () => {
    if (selectedExpense && confirm("Deseja realmente excluir esta despesa?")) {
      try {
        await expensesApi.delete(selectedExpense.id)
        await refreshExpenses()
        setSelectedExpense(null)
        setSelectedIndex(undefined)
      } catch (error) {
        console.error("Erro ao excluir despesa:", error)
        alert("Erro ao excluir despesa")
      }
    }
  }

  const handleSave = async () => {
    await refreshExpenses()
    setShowForm(false)
    setSelectedExpense(null)
    setSelectedIndex(undefined)
  }

  // Filtrar despesas por período
  const monthlyExpenses = useMemo(() => {
    return expenses.filter((expense: Expense) => {
      const expenseDate = new Date(expense.date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      return expenseDate >= start && expenseDate <= end
    })
  }, [expenses, startDate, endDate])

  const filteredExpenses = monthlyExpenses.filter(
    (e) =>
      e.name.toLowerCase().includes(filter.toLowerCase()) ||
      e.expense_type.toLowerCase().includes(filter.toLowerCase()),
  )

  const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0)

  return (
    <div className="space-y-2">
      <ErpWindow title="Cadastro de Despesas">
        <Toolbar
          buttons={[
            { label: "Novo", icon: "➕", onClick: handleNew },
            { label: "Editar", icon: "✏️", onClick: handleEdit, disabled: !selectedExpense },
            { label: "Excluir", icon: "🗑️", onClick: handleDelete, disabled: !selectedExpense },
            { label: "Atualizar", icon: "🔄", onClick: refreshExpenses },
          ]}
        />

        <div className="flex gap-2 mb-2 items-center">
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
          <label className="text-[11px] ml-4">Filtrar:</label>
          <input
            type="text"
            className="erp-input flex-1"
            placeholder="Digite o nome ou tipo..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <DataGrid
          columns={[
            { key: "name", header: "Nome da Despesa" },
            {
              key: "amount",
              header: "Valor",
              width: "120px",
              align: "right",
              render: (item) => `R$ ${Number(item.amount).toFixed(2).replace('.', ',')}`,
            },
            {
              key: "expense_type",
              header: "Tipo",
              width: "100px",
              render: (item) => (
                <StatusBadge color={item.expense_type === "FIXO" ? "green" : "yellow"}>
                  {item.expense_type === "FIXO" ? "FIXO" : "VARIÁVEL"}
                </StatusBadge>
              ),
            },
            {
              key: "date",
              header: "Data",
              width: "100px",
              render: (item) => new Date(item.date).toLocaleDateString('pt-BR'),
            },
            {
              key: "active",
              header: "Status",
              width: "80px",
              render: (item) => (
                <StatusBadge color={item.active ? "green" : "red"}>{item.active ? "ATIVO" : "INATIVO"}</StatusBadge>
              ),
            },
          ]}
          data={filteredExpenses}
          selectedIndex={selectedIndex}
          onRowClick={(item, index) => {
            setSelectedExpense(item)
            setSelectedIndex(index)
          }}
        />

        <div className="mt-2 text-[11px] erp-inset p-1 flex justify-between">
          <span>Total de registros: {filteredExpenses.length}</span>
          <span className="font-bold">Total de Despesas: R$ {totalExpenses.toFixed(2).replace('.', ',')}</span>
        </div>
      </ErpWindow>

      {showForm && <ExpenseForm expense={selectedExpense} onSave={handleSave} onCancel={() => setShowForm(false)} />}
    </div>
  )
}
