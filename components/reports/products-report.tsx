"use client"

import { useState, useEffect } from "react"
import { DataGrid } from "@/components/erp/data-grid"
import { productsApi, companyApi } from "@/lib/api"
import type { Product, Company } from "@/lib/types"
import { generatePDF } from "@/lib/utils/pdf-generator"
import { generateExcel } from "@/lib/utils/excel-generator"

export function ProductsReport() {
  const [products, setProducts] = useState<Product[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([loadProducts(), loadCompany()])
  }

  const loadCompany = async () => {
    try {
      const companies = await companyApi.getAll()
      if (companies && companies.length > 0) {
        setCompany(companies[0])
      }
    } catch (error) {
      console.error("Erro ao carregar empresa:", error)
    }
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productsApi.getAll()
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === products.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(products.map((_, idx) => idx)))
    }
  }

  const toggleSelectItem = (index: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedItems(newSelected)
  }

  const handleGenerateExcel = () => {
    const rows = selectedItems.size > 0
      ? products.filter((_, idx) => selectedItems.has(idx))
      : products
    if (rows.length === 0) { alert("Nenhum dado para exportar"); return }
    const excelData = rows.map(row => ({
      "Código": row.code,
      "Nome": row.name,
      "Categoria": row.category_name || '-',
      "Fornecedor": row.supplier_name || '-',
      "Preço Venda (R$)": Number(row.selling_price || 0),
      "Preço Compra (R$)": Number(row.purchase_price),
      "Estoque Atual": Number(row.current_stock),
      "Estoque Mínimo": Number(row.min_stock || 0),
      "Unidade": row.unit || '',
    }))
    generateExcel(excelData, 'relatorio-produtos', 'Produtos')
  }

  const handleGeneratePDF = async () => {
    if (selectedItems.size === 0) {
      alert("Selecione pelo menos um item para gerar o PDF")
      return
    }

    if (!company) {
      alert("Dados da empresa não encontrados. Cadastre a empresa primeiro.")
      return
    }

    // Filtrar apenas os itens selecionados
    const selectedData = products.filter((_, index) => selectedItems.has(index))

    // Preparar dados para o PDF
    const pdfData = selectedData.map(product => ({
      "Código": product.code,
      "Nome": product.name,
      "Categoria": product.category_name || "",
      "Preço Compra": `R$ ${Number(product.purchase_price).toFixed(2)}`,
      "Estoque": product.current_stock.toString(),
    }))

    // Calcular total
    const total = selectedData.reduce((sum, p) => sum + Number(p.purchase_price), 0)

    // Montar endereço completo
    const address = [company.street, company.number, company.neighborhood].filter(Boolean).join(", ")
    const city = [company.city, company.state].filter(Boolean).join("/")

    generatePDF({
      reportType: "Relatório de Produtos",
      reportDate: new Date().toLocaleDateString('pt-BR'),
      companyInfo: {
        name: company.nome_fantasia,
        cnpj: company.cnpj,
        address: address,
        city: city,
        phone: company.phone,
        email: company.email,
        contact: company.responsavel || undefined,
      },
      columns: [
        { text: "Código", width: 70 },
        { text: "Nome", width: "*" },
        { text: "Categoria", width: 100 },
        { text: "Preço Compra", width: 80, alignment: "right" },
        { text: "Estoque", width: 60, alignment: "right" },
      ],
      data: pdfData,
    })
  }

  if (loading) {
    return <div className="text-[11px] p-2">Carregando produtos...</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center mb-2">
        <button className="erp-button" onClick={handleGenerateExcel}>
          📊 Exportar Excel
        </button>
        <button className="erp-button ml-auto" onClick={handleGeneratePDF}>
          📄 Gerar PDF
        </button>
      </div>

      <div className="flex gap-2 items-center mb-2">
        <input
          type="checkbox"
          checked={selectedItems.size === products.length && products.length > 0}
          onChange={toggleSelectAll}
        />
        <label className="text-[11px]">Selecionar Todos ({selectedItems.size} de {products.length})</label>
      </div>

      <DataGrid
        columns={[
          {
            key: "checkbox",
            header: "✓",
            width: "30px",
            render: (item, index) => (
              <input
                type="checkbox"
                checked={selectedItems.has(index!)}
                onChange={() => toggleSelectItem(index!)}
              />
            ),
          },
          { key: "code", header: "Código", width: "100px" },
          { key: "name", header: "Nome", width: "200px" },
          { key: "category_name", header: "Categoria", width: "120px" },
          {
            key: "purchase_price",
            header: "Preço Compra",
            width: "100px",
            align: "right",
            render: (item) => `R$ ${Number(item.purchase_price).toFixed(2)}`,
          },
          {
            key: "current_stock",
            header: "Estoque",
            width: "80px",
            align: "right",
          },
          {
            key: "min_stock",
            header: "Est. Mín.",
            width: "80px",
            align: "right",
          },
          { key: "supplier_name", header: "Fornecedor", width: "150px" },
        ]}
        data={products}
        onRowClick={() => {}}
      />

      <div className="mt-2 text-[11px] erp-inset p-1">
        <span>Total de produtos: {products.length}</span>
      </div>
    </div>
  )
}
