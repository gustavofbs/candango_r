"use client"

import { useState, useEffect } from "react"
import { ExpensesContent } from "@/components/expenses/expenses-content"
import { expensesApi } from "@/lib/api"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])

  useEffect(() => {
    expensesApi.getAll().then((data: any) => setExpenses(Array.isArray(data) ? data : []))
  }, [])

  return <ExpensesContent initialExpenses={expenses} />
}
