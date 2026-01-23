"use client"

import type React from "react"

import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import { DataGrid } from "@/components/erp/data-grid"
import type { Customer, Product } from "@/lib/types"
import { salesApi, productsApi } from "@/lib/api"

interface SaleItem {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  discount: number
  total_price: number
}

interface SaleFormProps {
  customers: Customer[]
  products: Product[]
  onSave: () => void
  onCancel: () => void
}

export function SaleForm({ customers, products, onSave, onCancel }: SaleFormProps) {
  const safeCustomers = Array.isArray(customers) ? customers : []
  const safeProducts = Array.isArray(products) ? products : []
  const [formData, setFormData] = useState({
    customer_id: "",
    sale_date: new Date().toISOString().split("T")[0],
    payment_method: "dinheiro",
    status: "concluida",
    notes: "",
    discount: 0,
  })
  const [items, setItems] = useState<SaleItem[]>([])
  const [newItem, setNewItem] = useState({
    product_id: "",
    quantity: 1,
    discount: 0,
  })
  const [saving, setSaving] = useState(false)

  const addItem = () => {
    const product = safeProducts.find((p) => p.id === Number(newItem.product_id))
    if (!product) return

    const unitPrice = Number(product.sale_price)
    const totalPrice = unitPrice * newItem.quantity - newItem.discount

    setItems([
      ...items,
      {
        product_id: product.id,
        product_name: product.name,
        quantity: newItem.quantity,
        unit_price: unitPrice,
        discount: newItem.discount,
        total_price: totalPrice,
      },
    ])

    setNewItem({ product_id: "", quantity: 1, discount: 0 })
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const totalAmount = items.reduce((acc, item) => acc + item.total_price, 0)
  const finalAmount = totalAmount - formData.discount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      alert("Adicione pelo menos um item à venda")
      return
    }

    setSaving(true)

    // Generate sale number
    const saleNumber = `VND${Date.now().toString().slice(-8)}`

    // Create sale with items (API will handle stock movements automatically)
    await salesApi.create({
      sale_number: saleNumber,
      customer: formData.customer_id ? Number(formData.customer_id) : null,
      sale_date: formData.sale_date,
      total_amount: totalAmount,
      discount: formData.discount,
      payment_method: formData.payment_method,
      status: "concluida",
      notes: formData.notes,
      items: items.map(item => ({
        product: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
      })),
    })

    setSaving(false)
    onSave()
  }

  return (
    <ErpWindow title="Nova Venda">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <FieldGroup label="Dados da Venda">
            <div className="space-y-2">
              <FormField label="Cliente:" inline>
                <select
                  className="erp-select w-full"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {safeCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Data:" inline>
                <input
                  type="date"
                  className="erp-input"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                />
              </FormField>
              <FormField label="Pagamento:" inline>
                <select
                  className="erp-select"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                </select>
              </FormField>
              <FormField label="Status:" inline>
                <select
                  className="erp-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="concluida">Concluída</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </FormField>
            </div>
          </FieldGroup>

          <FieldGroup label="Adicionar Item">
            <div className="space-y-2">
              <FormField label="Produto:" inline>
                <select
                  className="erp-select w-full"
                  value={newItem.product_id}
                  onChange={(e) => setNewItem({ ...newItem, product_id: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {safeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name} (Est: {p.current_stock}) - R$ {Number(p.sale_price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Quantidade:" inline>
                <input
                  type="number"
                  min="1"
                  className="erp-input w-20"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Desconto:" inline>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="erp-input w-24"
                  value={newItem.discount}
                  onChange={(e) => setNewItem({ ...newItem, discount: Number(e.target.value) })}
                />
              </FormField>
              <button type="button" className="erp-button" onClick={addItem} disabled={!newItem.product_id}>
                ➕ Adicionar
              </button>
            </div>
          </FieldGroup>
        </div>

        <FieldGroup label="Itens da Venda">
          <DataGrid
            columns={[
              { key: "product_name", header: "Produto" },
              { key: "quantity", header: "Qtd", width: "60px", align: "right" },
              {
                key: "unit_price",
                header: "Preço Unit.",
                align: "right",
                render: (item) => `R$ ${item.unit_price.toFixed(2)}`,
              },
              {
                key: "discount",
                header: "Desconto",
                align: "right",
                render: (item) => `R$ ${item.discount.toFixed(2)}`,
              },
              {
                key: "total_price",
                header: "Total",
                align: "right",
                render: (item) => `R$ ${item.total_price.toFixed(2)}`,
              },
              {
                key: "actions",
                header: "",
                width: "60px",
                render: (_, index) => (
                  <button type="button" className="erp-button !min-w-0 !p-1" onClick={() => removeItem(index)}>
                    🗑️
                  </button>
                ),
              },
            ]}
            data={items}
            emptyMessage="Nenhum item adicionado"
          />
        </FieldGroup>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="erp-inset p-2 text-right">
            <span className="text-[11px]">Subtotal: </span>
            <strong>R$ {totalAmount.toFixed(2)}</strong>
          </div>
          <div className="erp-inset p-2">
            <FormField label="Desconto Geral:" inline>
              <input
                type="number"
                step="0.01"
                min="0"
                className="erp-input w-24 text-right"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
              />
            </FormField>
          </div>
          <div className="erp-inset p-2 text-right bg-[#ffffcc]">
            <span className="text-[11px]">TOTAL: </span>
            <strong className="text-lg">R$ {finalAmount.toFixed(2)}</strong>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button type="submit" className="erp-button" disabled={saving || items.length === 0}>
            {saving ? "Salvando..." : "💾 Finalizar Venda"}
          </button>
          <button type="button" className="erp-button" onClick={onCancel}>
            ❌ Cancelar
          </button>
        </div>
      </form>
    </ErpWindow>
  )
}

