"use client"

import { useState, useEffect } from "react"
import { CostsContent } from "@/components/costs/costs-content"
import { costsApi, productsApi, customersApi } from "@/lib/api"

export default function CostsPage() {
  const [costs, setCosts] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])

  useEffect(() => {
    Promise.all([costsApi.getAll(), productsApi.getAll(), customersApi.getAll()]).then(([c, p, cu]: any[]) => {
      setCosts(Array.isArray(c) ? c : [])
      setProducts((Array.isArray(p) ? p : []).filter((x: any) => x.active))
      setCustomers((Array.isArray(cu) ? cu : []).filter((x: any) => x.active))
    })
  }, [])

  return <CostsContent initialCosts={costs} products={products} customers={customers} />
}
