"use client"

import { useState, useEffect } from "react"
import { CategoriesContent } from "@/components/categories/categories-content"
import { categoriesApi } from "@/lib/api"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    categoriesApi.getAll().then((data: any) => setCategories(Array.isArray(data) ? data : []))
  }, [])

  return <CategoriesContent initialCategories={categories} />
}
