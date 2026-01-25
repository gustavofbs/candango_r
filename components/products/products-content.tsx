"use client"

import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { Toolbar } from "@/components/erp/toolbar"
import { StatusBadge } from "@/components/erp/status-badge"
import { ProductForm } from "@/components/products/product-form"
import type { Product, Category } from "@/lib/types"
import { productsApi } from "@/lib/api"

interface ProductsContentProps {
  initialProducts: Product[]
  categories: Category[]
}

export function ProductsContent({ initialProducts, categories }: ProductsContentProps) {
  const [products, setProducts] = useState(Array.isArray(initialProducts) ? initialProducts : [])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>()
  const [filter, setFilter] = useState("")

  const refreshProducts = async () => {
    try {
      const data = await productsApi.getAll()
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao atualizar produtos:", error)
    }
  }

  const handleNew = () => {
    setSelectedProduct(null)
    setShowForm(true)
  }

  const handleEdit = () => {
    if (selectedProduct) {
      setShowForm(true)
    }
  }

  const handleDelete = async () => {
    if (selectedProduct && confirm("Deseja realmente excluir este produto?")) {
      try {
        await productsApi.delete(selectedProduct.id)
        await refreshProducts()
        setSelectedProduct(null)
        setSelectedIndex(undefined)
      } catch (error) {
        console.error("Erro ao excluir produto:", error)
        alert("Erro ao excluir produto")
      }
    }
  }

  const handleSave = async () => {
    await refreshProducts()
    setShowForm(false)
    setSelectedProduct(null)
    setSelectedIndex(undefined)
  }

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(filter.toLowerCase()) || p.code.toLowerCase().includes(filter.toLowerCase()),
  )

  return (
    <div className="space-y-2">
      <ErpWindow title="Cadastro de Produtos">
        <Toolbar
          buttons={[
            { label: "Novo", icon: "➕", onClick: handleNew },
            { label: "Editar", icon: "✏️", onClick: handleEdit, disabled: !selectedProduct },
            { label: "Excluir", icon: "🗑️", onClick: handleDelete, disabled: !selectedProduct },
            { label: "Atualizar", icon: "🔄", onClick: refreshProducts },
          ]}
        />

        <div className="flex gap-2 mb-2">
          <label className="text-[11px]">Filtrar:</label>
          <input
            type="text"
            className="erp-input flex-1"
            placeholder="Digite o código ou nome do produto..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <DataGrid
          columns={[
            { key: "code", header: "Código", width: "80px" },
            { key: "name", header: "Nome do Produto" },
            {
              key: "category",
              header: "Categoria",
              render: (item) => item.category_name || "-",
            },
            { key: "unit", header: "Un.", width: "50px" },
            {
              key: "purchase_price",
              header: "Preço Compra",
              align: "right",
              render: (item) => `R$ ${Number(item.purchase_price).toFixed(2)}`,
            },
            {
              key: "current_stock",
              header: "Estoque",
              align: "right",
              render: (item) => (
                <StatusBadge
                  color={item.current_stock <= 0 ? "red" : item.current_stock < item.min_stock ? "yellow" : "green"}
                >
                  {item.current_stock}
                </StatusBadge>
              ),
            },
            {
              key: "active",
              header: "Status",
              render: (item) => (
                <StatusBadge color={item.active ? "green" : "red"}>{item.active ? "ATIVO" : "INATIVO"}</StatusBadge>
              ),
            },
          ]}
          data={filteredProducts}
          selectedIndex={selectedIndex}
          onRowClick={(item, index) => {
            setSelectedProduct(item)
            setSelectedIndex(index)
          }}
        />

        <div className="mt-2 text-[11px] erp-inset p-1">Total de registros: {filteredProducts.length}</div>
      </ErpWindow>

      {showForm && (
        <ProductForm
          product={selectedProduct}
          categories={categories}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
