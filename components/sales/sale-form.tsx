"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ErpWindow } from "@/components/erp/window"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import { DataGrid } from "@/components/erp/data-grid"
import type { Customer, Product, CostRefinement, Sale } from "@/lib/types"
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
  sale?: Sale | null
  onSave: () => void
  onCancel: () => void
}

export function SaleForm({ customers, products, sale, onSave, onCancel }: SaleFormProps) {
  const safeCustomers = Array.isArray(customers) ? customers : []
  const safeProducts = Array.isArray(products) ? products : []
  const [saleNumber, setSaleNumber] = useState(sale?.sale_number || "")
  
  // Função para obter data local no formato YYYY-MM-DD
  const getLocalDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const [formData, setFormData] = useState({
    customer_id: sale?.customer?.toString() || "",
    sale_date: sale?.sale_date || getLocalDateString(),
    sale_type: sale?.sale_type || "venda",
    payment_method: sale?.payment_method || "dinheiro",
    nf: sale?.nf || "",
    tax_percentage: sale?.tax_percentage || "",
    status: sale?.status || "disputa",
    notes: sale?.notes || "",
    discount: sale?.discount || 0,
  })
  const [items, setItems] = useState<SaleItem[]>(
    sale?.items?.map(item => {
      const itemTotal = (item.quantity * item.unit_price) - item.discount + item.tax + item.freight
      return {
        product_id: item.product,
        product_name: item.product_name || "",
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost,
        cost_refinement_code: item.cost_refinement_code,
        discount: item.discount,
        tax: item.tax,
        freight: item.freight,
        total_price: itemTotal,
      }
    }) || []
  )
  const [newItem, setNewItem] = useState({
    product_id: "",
    quantity: 1,
    unit_price: 0,
    discount: 0,
    cost_refinement_code: "",
    tax: 0,
    freight: 0,
  })
  const [refinements, setRefinements] = useState<CostRefinement[]>([])
  const [loadingRefinements, setLoadingRefinements] = useState(false)
  const [saving, setSaving] = useState(false)

  // Busca o próximo número de venda ao criar nova venda
  useEffect(() => {
    const fetchNextNumber = async () => {
      if (!sale) {
        try {
          const nextNum = await salesApi.getNextNumber()
          setSaleNumber(nextNum)
        } catch (error) {
          console.error("Erro ao buscar próximo número:", error)
          setSaleNumber("00001")
        }
      }
    }
    fetchNextNumber()
  }, [])

  // Recarrega dados quando a venda mudar
  useEffect(() => {
    if (sale) {
      setFormData({
        customer_id: sale.customer?.toString() || "",
        sale_date: sale.sale_date || new Date().toISOString().split("T")[0],
        sale_type: sale.sale_type || "venda",
        payment_method: sale.payment_method || "dinheiro",
        nf: sale.nf || "",
        tax_percentage: sale.tax_percentage || "",
        status: sale.status || "disputa",
        notes: sale.notes || "",
        discount: sale.discount || 0,
      })
      
      if (sale.items && sale.items.length > 0) {
        const loadedItems = sale.items.map(item => {
          const itemTotal = (Number(item.quantity) * Number(item.unit_price)) - Number(item.discount) + Number(item.tax) + Number(item.freight)
          return {
            product_id: item.product,
            product_name: item.product_name || "",
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            unit_cost: Number(item.unit_cost),
            cost_refinement_code: item.cost_refinement_code,
            discount: Number(item.discount),
            tax: Number(item.tax),
            freight: Number(item.freight),
            total_price: itemTotal,
          }
        })
        console.log("Loaded items:", loadedItems)
        setItems(loadedItems)
      }
    }
  }, [sale])

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
    // Se não houver refinamento, usa o preço de compra do produto
    const selectedRefinement = refinements.find((r: any) => r.refinement_code === newItem.cost_refinement_code)
    const unitCost = selectedRefinement ? Number(selectedRefinement.total) : Number(product.purchase_price)

    const unitPrice = Number(newItem.unit_price)
    const totalPrice = (unitPrice * newItem.quantity) - newItem.discount + Number(newItem.tax) + Number(newItem.freight)

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
        tax: Number(newItem.tax),
        freight: Number(newItem.freight),
        total_price: totalPrice,
      },
    ])

    setNewItem({ product_id: "", quantity: 1, unit_price: 0, discount: 0, cost_refinement_code: "", tax: 0, freight: 0 })
    setRefinements([])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const totalAmount = items.reduce((acc, item) => acc + (Number(item.total_price) || 0), 0)
  const finalAmount = totalAmount - (Number(formData.discount) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      alert("Adicione pelo menos um item à venda")
      return
    }

    setSaving(true)

    try {
      // Prepara os dados da venda
      const saleData = {
        sale_number: saleNumber,
        sale_type: formData.sale_type,
        customer: formData.customer_id ? Number(formData.customer_id) : null,
        sale_date: formData.sale_date,
        total_amount: Number(totalAmount.toFixed(2)),
        discount: Number(Number(formData.discount).toFixed(2)),
        payment_method: formData.payment_method,
        nf: formData.nf || null,
        tax_percentage: Number(Number(formData.tax_percentage).toFixed(2)),
        status: formData.status,
        notes: formData.notes,
        items: items.map(item => ({
          product: item.product_id,
          quantity: Number(Number(item.quantity).toFixed(2)),
          unit_price: Number(Number(item.unit_price).toFixed(2)),
          unit_cost: Number(Number(item.unit_cost).toFixed(2)),
          cost_refinement_code: item.cost_refinement_code || null,
          discount: Number(Number(item.discount).toFixed(2)),
          tax: Number(Number(item.tax).toFixed(2)),
          freight: Number(Number(item.freight).toFixed(2)),
        })),
      }

      console.log("Dados da venda:", JSON.stringify(saleData, null, 2))

      // Create or update sale
      if (sale) {
        await salesApi.update(sale.id, saleData)
      } else {
        await salesApi.create(saleData)
      }

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
              <FormField label="Data:" inline>
                <input
                  type="date"
                  className="erp-input"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                />
              </FormField>
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
              <FormField label="Tipo:" inline>
                <select
                  className="erp-select"
                  value={formData.sale_type}
                  onChange={(e) => setFormData({ ...formData, sale_type: e.target.value })}
                >
                  <option value="venda">Venda</option>
                  <option value="dispensa">Dispensa</option>
                  <option value="pregao">Pregão</option>
                </select>
              </FormField>
              <FormField label="NF:" inline>
                <input
                  type="text"
                  className="erp-input"
                  value={formData.nf}
                  onChange={(e) => setFormData({ ...formData, nf: e.target.value })}
                  placeholder="Número da Nota Fiscal"
                />
              </FormField>
              <FormField label="% Imposto:" inline>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="erp-input w-24"
                  value={formData.tax_percentage}
                  onChange={(e) => setFormData({ ...formData, tax_percentage: e.target.value === "" ? "" : Number(e.target.value) })}
                  placeholder="0.00"
                />
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
                      {p.code} - {p.name} (Est: {p.current_stock})
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Valor de venda:" inline>
                <input
                  type="text"
                  className="erp-input w-32"
                  value={newItem.unit_price === 0 ? "" : `R$ ${Number(newItem.unit_price).toFixed(2).replace('.', ',')}`}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '')
                    const valueInReais = numericValue === "" ? 0 : Number(numericValue) / 100
                    setNewItem({ ...newItem, unit_price: valueInReais })
                  }}
                  placeholder="R$ 0,00"
                />
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
              <FormField label="Frete:" inline>
                <input
                  type="text"
                  className="erp-input w-32"
                  value={newItem.freight === 0 ? "" : `R$ ${Number(newItem.freight).toFixed(2).replace('.', ',')}`}
                  onChange={(e) => {
                    // Remove tudo exceto números
                    const numericValue = e.target.value.replace(/\D/g, '')
                    // Converte centavos para reais (divide por 100)
                    const valueInReais = numericValue === "" ? 0 : Number(numericValue) / 100
                    setNewItem({ ...newItem, freight: valueInReais })
                  }}
                  placeholder="R$ 0,00"
                />
              </FormField>
              <FormField label="Status:" inline>
                <select
                  className="erp-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="disputa">Disputa</option>
                  <option value="aguardando_julgamento">Aguardando Julgamento</option>
                  <option value="homologado">Homologado</option>
                  <option value="em_producao">Em Produção</option>
                  <option value="em_transito">Em Trânsito</option>
                  <option value="aguardando_pagamento">Aguardando Pagamento</option>
                  <option value="liquidado">Liquidado</option>
                </select>
              </FormField>
              <button type="button" className="erp-button" onClick={addItem} disabled={!newItem.product_id}>
                ➜ Adicionar
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
                render: (item) => `R$ ${Number(item.unit_price).toFixed(2)}`,
              },
              {
                key: "unit_cost",
                header: "Custo Unit.",
                width: "90px",
                align: "right",
                render: (item) => `R$ ${Number(item.unit_cost).toFixed(2)}`,
              },
              {
                key: "tax",
                header: "Imposto",
                width: "80px",
                align: "right",
                render: (item) => `R$ ${Number(item.tax).toFixed(2)}`,
              },
              {
                key: "freight",
                header: "Frete",
                width: "70px",
                align: "right",
                render: (item) => `R$ ${Number(item.freight).toFixed(2)}`,
              },
              {
                key: "total_price",
                header: "Total",
                width: "90px",
                align: "right",
                render: (item) => `R$ ${Number(item.total_price).toFixed(2)}`,
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

        <div className="flex justify-end mt-4">
          <div className="erp-inset p-2 text-right bg-[#ffffcc] min-w-[200px]">
            <span className="text-[11px]">TOTAL: </span>
            <strong className="text-lg">R$ {totalAmount.toFixed(2)}</strong>
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

