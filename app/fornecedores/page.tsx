"use client"

import { useState, useEffect } from "react"
import { SuppliersContent } from "@/components/suppliers/suppliers-content"
import { suppliersApi } from "@/lib/api"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])

  useEffect(() => {
    suppliersApi.getAll().then((data: any) => setSuppliers(Array.isArray(data) ? data : []))
  }, [])

  return <SuppliersContent initialSuppliers={suppliers} />
}
