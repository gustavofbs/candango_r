"use client"

import { useState, useEffect } from "react"
import { ProductsContent } from "@/components/products/products-content"
import { productsApi, categoriesApi } from "@/lib/api"

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    Promise.all([productsApi.getAll(), categoriesApi.getAll()]).then(([p, c]: any[]) => {
      setProducts(Array.isArray(p) ? p : [])
      setCategories(Array.isArray(c) ? c : [])
    })
  }, [])

  return <ProductsContent initialProducts={products} categories={categories} />
}
