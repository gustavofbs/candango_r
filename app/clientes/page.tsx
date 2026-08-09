"use client"

import { useState, useEffect } from "react"
import { CustomersContent } from "@/components/customers/customers-content"
import { customersApi } from "@/lib/api"
import type { Customer } from "@/lib/types"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    customersApi.getAll().then((data: any) => setCustomers(Array.isArray(data) ? data : []))
  }, [])

  return <CustomersContent initialCustomers={customers} />
}
