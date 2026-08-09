"use client"

import { useState, useEffect } from "react"
import { ProductionInputContent } from "@/components/costs/production-input-content"
import { costsApi, productsApi } from "@/lib/api"

export default function ProductionCostsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      costsApi.getRefinements(undefined, true, 'production'),
      productsApi.getAll(),
    ]).then(([g, p]: any[]) => {
      setGroups(Array.isArray(g) ? g : [])
      setProducts((Array.isArray(p) ? p : []).filter((x: any) => x.active))
    })
  }, [])

  return <ProductionInputContent initialGroups={groups} products={products} />
}
