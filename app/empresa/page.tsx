"use client"

import { useEffect, useState } from "react"
import { CompanyForm } from "@/components/company/company-form"
import { companyApi } from "@/lib/api"
import type { Company } from "@/lib/types"

export default function CompanyPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompany()
  }, [])

  const loadCompany = async () => {
    try {
      const companies = await companyApi.getAll()
      setCompany(companies.length > 0 ? companies[0] : null)
    } catch (error) {
      console.error("Erro ao carregar empresa:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    window.location.reload()
  }

  const handleCancel = () => {
    window.location.href = "/"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  return <CompanyForm company={company} onSave={handleSave} onCancel={handleCancel} />
}
