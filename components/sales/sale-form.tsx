"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ErpWindow } from "@/components/erp/window"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import { DataGrid } from "@/components/erp/data-grid"
import type { Customer, Product, CostRefinement } from "@/lib/types"
import { salesApi, productsApi, costsApi } from "@/lib/api"

interface SaleItem {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  unit_cost: number
  cost_refinement_code?: string
  discount: number
  tax: number
  freight: number
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
    status: "disputa",
    notes: "",
    discount: 0,
  })
  const [items, setItems] = useState<SaleItem[]>([])
  const [newItem, setNewItem] = useState({
    product_id: "",
    quantity: 1,
    discount: 0,
    cost_refinement_code: "",
    tax: 0,
    freight: 0,
  })
  const [refinements, setRefinements] = useState<CostRefinement[]>([])
  const [loadingRefinements, setLoadingRefinements] = useState(false)
  const [saving, setSaving] = useState(false)

  // Busca refinamentos quando produto é selecionado
  useEffect(() => {
    const fetchRefinements = async () => {
      if (newItem.product_id) {
        setLoadingRefinements(true)
        try {
          const data = await costsApi.getRefinements(Number(newItem.product_id), false)
          setRefinements(data)
        } catch (error) {
          console.error("Erro ao buscar refinamentos:", error)
          setRefinements([])
        } finally {
          setLoadingRefinements(false)
        }
      } else {
        setRefinements([])
      }
    }
    fetchRefinements()
  }, [newItem.product_id])

  const addItem = () => {
    const product = safeProducts.find((p) => p.id === Number(newItem.product_id))
    if (!product) return

    // Busca o refinamento selecionado para pegar o custo
    const selectedRefinement = refinements.find((r: any) => r.refinement_code === newItem.cost_refinement_code)
    const unitCost = selectedRefinement ? Number(selectedRefinement.total) : 0

    const unitPrice = Number(product.sale_price)
    const totalPrice = unitPrice * newItem.quantity - newItem.discount

    setItems([
      ...items,
      {
        product_id: product.id,
        product_name: product.name,
        quantity: newItem.quantity,
        unit_price: unitPrice,
        unit_cost: unitCost,
        cost_refinement_code: newItem.cost_refinement_code || undefined,
        discount: newItem.discount,
        tax: newItem.tax,
        freight: newItem.freight,
        total_price: totalPrice,
      },
    ])

    setNewItem({ product_id: "", quantity: 1, discount: 0, cost_refinement_code: "", tax: 0, freight: 0 })
    setRefinements([])
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

    try {
      // Generate sale number
      const saleNumber = `VND${Date.now().toString().slice(-8)}`

      // Prepara os dados da venda
      const saleData = {
        sale_number: saleNumber,
        customer: formData.customer_id ? Number(formData.customer_id) : null,
        sale_date: formData.sale_date,
        total_amount: Number(totalAmount.toFixed(2)),
        discount: Number(formData.discount.toFixed(2)),
        payment_method: formData.payment_method,
        status: formData.status,
        notes: formData.notes,
        items: items.map(item => ({
          product: item.product_id,
          quantity: Number(item.quantity.toFixed(2)),
          unit_price: Number(item.unit_price.toFixed(2)),
          unit_cost: Number(item.unit_cost.toFixed(2)),
          cost_refinement_code: item.cost_refinement_code || null,
          discount: Number(item.discount.toFixed(2)),
          tax: Number(item.tax.toFixed(2)),
          freight: Number(item.freight.toFixed(2)),
        })),
      }

      console.log("Dados da venda:", JSON.stringify(saleData, null, 2))

      // Create sale with items (API will handle stock movements automatically)
      await salesApi.create(saleData)

      setSaving(false)
      onSave()
    } catch (error: any) {
      setSaving(false)
      console.error("Erro ao criar venda:", error)
      
      // Mostra mensagem de erro detalhada
      let errorMessage = "Erro ao criar venda"
      if (error.response?.data) {
        errorMessage = JSON.stringify(error.response.data, null, 2)
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert(`Erro ao criar venda:\n\n${errorMessage}`)
    }
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
                  <option value="disputa">Disputa</option>
                  <option value="homologado">Homologado</option>
                  <option value="producao">Produção</option>
                  <option value="aguardando_pagamento">Aguardando Pagamento</option>
                  <option value="liquidado">Liquidado</option>
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
              <FormField label="Refinamento:" inline>
                <select
                  className="erp-select w-full"
                  value={newItem.cost_refinement_code}
                  onChange={(e) => setNewItem({ ...newItem, cost_refinement_code: e.target.value })}
                  disabled={!newItem.product_id || loadingRefinements}
                >
                  <option value="">
                    {loadingRefinements ? "Carregando..." : !newItem.product_id ? "Selecione um produto primeiro" : "Nenhum refinamento"}
                  </option>
                  {refinements.map((ref) => (
                    <option key={ref.refinement_code} value={ref.refinement_code}>
                      {ref.refinement_code} - {ref.refinement_name} (R$ {ref.total.toFixed(2)})
                      {ref.is_locked && ` 🔒 Usado em ${ref.locked_by_sale_number}`}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Imposto:" inline>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="erp-input w-24"
                  value={newItem.tax}
                  onChange={(e) => setNewItem({ ...newItem, tax: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Frete:" inline>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="erp-input w-24"
                  value={newItem.freight}
                  onChange={(e) => setNewItem({ ...newItem, freight: Number(e.target.value) })}
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
              { key: "quantity", header: "Qtd", width: "50px", align: "right" },
              {
                key: "unit_price",
                header: "Preço Unit.",
                width: "90px",
                align: "right",
                render: (item) => `R$ ${item.unit_price.toFixed(2)}`,
              },
              {
                key: "unit_cost",
                header: "Custo Unit.",
                width: "90px",
                align: "right",
                render: (item) => `R$ ${item.unit_cost.toFixed(2)}`,
              },
              {
                key: "discount",
                header: "Desc.",
                width: "70px",
                align: "right",
                render: (item) => `R$ ${item.discount.toFixed(2)}`,
              },
              {
                key: "tax",
                header: "Imposto",
                width: "80px",
                align: "right",
                render: (item) => `R$ ${item.tax.toFixed(2)}`,
              },
              {
                key: "freight",
                header: "Frete",
                width: "70px",
                align: "right",
                render: (item) => `R$ ${item.freight.toFixed(2)}`,
              },
              {
                key: "total_price",
                header: "Total",
                width: "90px",
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

