"use client"

import { useState, useEffect } from "react"
import { SalesContent } from "@/components/sales/sales-content"
import { salesApi, customersApi, productsApi } from "@/lib/api"

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    Promise.all([salesApi.getAll(), customersApi.getAll(), productsApi.getAll()]).then(([s, c, p]: any[]) => {
      setSales(Array.isArray(s) ? s : [])
      setCustomers((Array.isArray(c) ? c : []).filter((x: any) => x.active))
      setProducts((Array.isArray(p) ? p : []).filter((x: any) => x.active))
    })
  }, [])

  return <SalesContent initialSales={sales} customers={customers} products={products} />
}
