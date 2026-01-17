"use client"

import type React from "react"

import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import type { Product, Category } from "@/lib/types"
import { getSupabaseClient } from "@/lib/supabase/client"

interface ProductFormProps {
  product: Product | null
  categories: Category[]
  onSave: () => void
  onCancel: () => void
}

export function ProductForm({ product, categories, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    code: product?.code || "",
    name: product?.name || "",
    description: product?.description || "",
    category_id: product?.category_id || "",
    unit: product?.unit || "UN",
    purchase_price: product?.purchase_price || 0,
    sale_price: product?.sale_price || 0,
    current_stock: product?.current_stock || 0,
    min_stock: product?.min_stock || 0,
    max_stock: product?.max_stock || 0,
    location: product?.location || "",
    active: product?.active ?? true,
  })
  const [saving, setSaving] = useState(false)

  const supabase = getSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const data = {
      ...formData,
      category_id: formData.category_id || null,
      purchase_price: Number(formData.purchase_price),
      sale_price: Number(formData.sale_price),
      current_stock: Number(formData.current_stock),
      min_stock: Number(formData.min_stock),
      max_stock: Number(formData.max_stock),
    }

    if (product) {
      await supabase.from("products").update(data).eq("id", product.id)
    } else {
      await supabase.from("products").insert(data)
    }

    setSaving(false)
    onSave()
  }

  return (
    <ErpWindow title={product ? "Editar Produto" : "Novo Produto"}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2">
          <FieldGroup label="Dados Básicos">
            <div className="space-y-2">
              <FormField label="Código:" inline>
                <input
                  type="text"
                  className="erp-input w-32"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Nome:" inline>
                <input
                  type="text"
                  className="erp-input flex-1 w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Descrição:" inline>
                <input
                  type="text"
                  className="erp-input flex-1 w-full"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </FormField>
              <FormField label="Categoria:" inline>
                <select
                  className="erp-select w-48"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Unidade:" inline>
                <select
                  className="erp-select w-24"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="UN">UN</option>
                  <option value="KG">KG</option>
                  <option value="LT">LT</option>
                  <option value="MT">MT</option>
                  <option value="CX">CX</option>
                  <option value="PC">PC</option>
                </select>
              </FormField>
              <FormField label="Localização:" inline>
                <input
                  type="text"
                  className="erp-input w-32"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </FormField>
            </div>
          </FieldGroup>

          <FieldGroup label="Preços e Estoque">
            <div className="space-y-2">
              <FormField label="Preço Compra:" inline>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input w-28 text-right"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Preço Venda:" inline>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input w-28 text-right"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Estoque Atual:" inline>
                <input
                  type="number"
                  className="erp-input w-20 text-right"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Estoque Mín.:" inline>
                <input
                  type="number"
                  className="erp-input w-20 text-right"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Estoque Máx.:" inline>
                <input
                  type="number"
                  className="erp-input w-20 text-right"
                  value={formData.max_stock}
                  onChange={(e) => setFormData({ ...formData, max_stock: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Ativo:" inline>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
              </FormField>
            </div>
          </FieldGroup>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button type="submit" className="erp-button" disabled={saving}>
            {saving ? "Salvando..." : "💾 Salvar"}
          </button>
          <button type="button" className="erp-button" onClick={onCancel}>
            ❌ Cancelar
          </button>
        </div>
      </form>
    </ErpWindow>
  )
}
