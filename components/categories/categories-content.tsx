"use client"

import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { Toolbar } from "@/components/erp/toolbar"
import type { Category } from "@/lib/types"
import { categoriesApi } from "@/lib/api"

interface CategoriesContentProps {
  initialCategories: Category[]
}

export function CategoriesContent({ initialCategories }: CategoriesContentProps) {
  const [categories, setCategories] = useState(Array.isArray(initialCategories) ? initialCategories : [])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: "", description: "" })

  const refreshCategories = async () => {
    try {
      const data = await categoriesApi.getAll()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao atualizar categorias:", error)
    }
  }

  const handleNew = () => {
    setSelectedCategory(null)
    setFormData({ name: "", description: "" })
    setShowForm(true)
  }

  const handleEdit = () => {
    if (selectedCategory) {
      setFormData({
        name: selectedCategory.name,
        description: selectedCategory.description || "",
      })
      setShowForm(true)
    }
  }

  const handleDelete = async () => {
    if (selectedCategory && confirm("Deseja realmente excluir esta categoria?")) {
      try {
        await categoriesApi.delete(selectedCategory.id)
        await refreshCategories()
        setSelectedCategory(null)
        setSelectedIndex(undefined)
      } catch (error) {
        console.error("Erro ao excluir categoria:", error)
        alert("Erro ao excluir categoria")
      }
    }
  }

  const handleSave = async () => {
    try {
      if (selectedCategory) {
        await categoriesApi.update(selectedCategory.id, formData)
      } else {
        await categoriesApi.create(formData)
      }
      await refreshCategories()
      setShowForm(false)
      setSelectedCategory(null)
      setSelectedIndex(undefined)
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
      alert("Erro ao salvar categoria")
    }
  }

  return (
    <div className="space-y-2">
      <ErpWindow title="Cadastro de Categorias">
        <Toolbar
          buttons={[
            { label: "Novo", icon: "➕", onClick: handleNew },
            { label: "Editar", icon: "✏️", onClick: handleEdit, disabled: !selectedCategory },
            { label: "Excluir", icon: "🗑️", onClick: handleDelete, disabled: !selectedCategory },
            { label: "Atualizar", icon: "🔄", onClick: refreshCategories },
          ]}
        />

        <DataGrid
          columns={[
            { key: "id", header: "ID", width: "60px" },
            { key: "name", header: "Nome da Categoria" },
            { key: "description", header: "Descrição" },
            {
              key: "created_at",
              header: "Criado em",
              width: "120px",
              render: (item) => new Date(item.created_at).toLocaleDateString("pt-BR"),
            },
          ]}
          data={categories}
          selectedIndex={selectedIndex}
          onRowClick={(item, index) => {
            setSelectedCategory(item)
            setSelectedIndex(index)
          }}
        />

        <div className="mt-2 text-[11px] erp-inset p-1">Total de registros: {categories.length}</div>
      </ErpWindow>

      {showForm && (
        <ErpWindow title={selectedCategory ? "Editar Categoria" : "Nova Categoria"}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-[11px] w-20">Nome:</label>
              <input
                type="text"
                className="erp-input flex-1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] w-20">Descrição:</label>
              <input
                type="text"
                className="erp-input flex-1"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="erp-button" onClick={handleSave}>
                💾 Salvar
              </button>
              <button className="erp-button" onClick={() => setShowForm(false)}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        </ErpWindow>
      )}
    </div>
  )
}

