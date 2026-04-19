"use client"

import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { SalesReport } from "@/components/reports/sales-report"
import { CustomersReport } from "@/components/reports/customers-report"
import { ProductsReport } from "@/components/reports/products-report"
import { CostsReport } from "@/components/reports/costs-report"

type ReportTab = "sales" | "customers" | "products" | "costs"

export function ReportsContent() {
  const [activeTab, setActiveTab] = useState<ReportTab>("sales")

  return (
    <div className="space-y-2">
      <ErpWindow title="Relatórios">
        <div className="flex gap-1 mb-2 border-b border-gray-400 pb-1">
          <button
            className={`px-3 py-1 text-[11px] erp-button ${
              activeTab === "sales" ? "erp-inset" : ""
            }`}
            onClick={() => setActiveTab("sales")}
          >
            📊 Vendas
          </button>
          <button
            className={`px-3 py-1 text-[11px] erp-button ${
              activeTab === "customers" ? "erp-inset" : ""
            }`}
            onClick={() => setActiveTab("customers")}
          >
            👥 Clientes
          </button>
          <button
            className={`px-3 py-1 text-[11px] erp-button ${
              activeTab === "products" ? "erp-inset" : ""
            }`}
            onClick={() => setActiveTab("products")}
          >
            📦 Produtos
          </button>
          <button
            className={`px-3 py-1 text-[11px] erp-button ${
              activeTab === "costs" ? "erp-inset" : ""
            }`}
            onClick={() => setActiveTab("costs")}
          >
            💰 Custos de Produção
          </button>
        </div>

        {activeTab === "sales" && <SalesReport />}
        {activeTab === "customers" && <CustomersReport />}
        {activeTab === "products" && <ProductsReport />}
        {activeTab === "costs" && <CostsReport />}
      </ErpWindow>
    </div>
  )
}
