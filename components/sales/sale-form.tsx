"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import { ErpWindow } from "@/components/erp/window"
import { FieldGroup, FormField } from "@/components/erp/field-group"
import { DataGrid } from "@/components/erp/data-grid"
import type { Customer, Product, CostRefinement, Sale } from "@/lib/types"
import { salesApi, productsApi, costsApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface SaleItem {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  unit_cost: number
  cost_refinement_code?: string
  create_refinement?: boolean
  discount: number
  discountPct: number
  tax: number
  freight: number
  total_price: number
  item_status: string
}

interface SaleFormProps {
  customers: Customer[]
  products: Product[]
  sale?: Sale | null
  onSave: () => void
  onCancel: () => void
}

export function SaleForm({ customers, products, sale, onSave, onCancel }: SaleFormProps) {
  const { user } = useAuth()
  const maxDiscount = user?.is_staff ? 100 : (user?.max_discount ?? 0)
  const isAdmin = user?.is_staff === true
  const safeCustomers = Array.isArray(customers) ? customers : []
  const safeProducts = Array.isArray(products) ? products : []
  const [saleNumber, setSaleNumber] = useState(sale?.sale_number || "")
  const [customerQuery, setCustomerQuery] = useState("")
  const [customerOpen, setCustomerOpen] = useState(false)
  const [productQuery, setProductQuery] = useState("")
  const [productOpen, setProductOpen] = useState(false)
  const customerRef = useRef<HTMLDivElement>(null)
  const productRef = useRef<HTMLDivElement>(null)
  
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
        discountPct: (Number(item.quantity) > 0 && Number(item.unit_price) > 0) ? Math.round((Number(item.discount) / (Number(item.quantity) * Number(item.unit_price))) * 100) : 0,
        tax: item.tax,
        freight: item.freight,
        total_price: itemTotal,
        item_status: item.item_status || 'pendente',
      }
    }) || []
  )
  const [newItem, setNewItem] = useState({
    product_id: "",
    quantity: 1,
    unit_price: 0,
    discount: 0,
    create_refinement: false,
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
            discountPct: (Number(item.quantity) > 0 && Number(item.unit_price) > 0) ? Math.round((Number(item.discount) / (Number(item.quantity) * Number(item.unit_price))) * 100) : 0,
            tax: Number(item.tax),
            freight: Number(item.freight),
            total_price: itemTotal,
            item_status: item.item_status || 'pendente',
          }
        })
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

  const uniformeAutoStatus = useMemo(() => {
    if (formData.sale_type !== 'uniforme') return null
    if (items.length === 0) return 'em_producao'
    return items.every(i => i.item_status === 'entregue') ? 'liquidado' : 'em_producao'
  }, [formData.sale_type, items])

  const selectedCustomer = safeCustomers.find(c => c.id.toString() === formData.customer_id)
  const filteredCustomers = customerQuery
    ? safeCustomers.filter(c => c.name.toLowerCase().includes(customerQuery.toLowerCase()))
    : safeCustomers
  const filteredProducts = productQuery
    ? safeProducts.filter(p => p.name.toLowerCase().includes(productQuery.toLowerCase()))
    : safeProducts

  const addItem = () => {
    const product = safeProducts.find((p) => p.id === Number(newItem.product_id))
    if (!product) return

    const unitCost = newItem.create_refinement ? 0 : Number(product.purchase_price)
    const defaultPrice = product.selling_price ? Number(product.selling_price) : Number(newItem.unit_price)
    const unitPrice = Number(newItem.unit_price) || defaultPrice
    const totalPrice = (unitPrice * newItem.quantity) - newItem.discount + Number(newItem.tax) + Number(newItem.freight)

    setItems([
      ...items,
      {
        product_id: product.id,
        product_name: product.name,
        quantity: newItem.quantity,
        unit_price: unitPrice,
        unit_cost: unitCost,
        create_refinement: newItem.create_refinement,
        discount: newItem.discount,
        discountPct: 0,
        tax: Number(newItem.tax),
        freight: Number(newItem.freight),
        total_price: totalPrice,
        item_status: 'pendente',
      },
    ])

    setNewItem({ product_id: "", quantity: 1, unit_price: 0, discount: 0, create_refinement: false, tax: 0, freight: 0 })
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
      const effectiveStatus = uniformeAutoStatus ?? formData.status
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
        status: effectiveStatus,
        notes: formData.notes,
        items: items.map(item => ({
          product: item.product_id,
          quantity: Number(Number(item.quantity).toFixed(2)),
          unit_price: Number(Number(item.unit_price).toFixed(2)),
          unit_cost: Number(Number(item.unit_cost).toFixed(2)),
          cost_refinement_code: item.create_refinement 
            ? `REF-${saleNumber}-${item.product_id}` 
            : (item.cost_refinement_code || null),
          discount: Number(Number(item.discount).toFixed(2)),
          tax: Number(Number(item.tax).toFixed(2)),
          freight: Number(Number(item.freight).toFixed(2)),
          item_status: item.item_status || 'pendente',
        })),
      }

      console.log("Dados da venda:", JSON.stringify(saleData, null, 2))

      // Create or update sale
      let createdSale
      if (sale) {
        createdSale = await salesApi.update(sale.id, saleData)
      } else {
        createdSale = await salesApi.create(saleData)
      }

      // Criar custos de produção para itens com create_refinement marcado
      const itemsWithRefinement = items.filter(item => item.create_refinement)
      if (itemsWithRefinement.length > 0 && createdSale) {
        const saleId = (createdSale as any).id || sale?.id
        const resolvedSaleNumber = (createdSale as any).sale_number || sale?.sale_number
        
        // Tipos de custo padrão que serão criados automaticamente
        const defaultCostTypes = [
          { cost_type: 'Camisa Lisa', description: 'Custo da camisa base' },
          { cost_type: 'DTF/Silk/Sublimação', description: 'Custo de impressão' },
          { cost_type: 'Frete/Uber', description: 'Custo de transporte' },
          { cost_type: 'Imposto', description: 'Impostos e taxas' },
        ]
        
        const costErrors: string[] = []
        for (const item of itemsWithRefinement) {
          try {
            // Criar 4 custos de produção padrão para cada item
            for (const costType of defaultCostTypes) {
              await costsApi.create({
                product: item.product_id,
                customer: formData.customer_id ? Number(formData.customer_id) : null,
                description: costType.description,
                cost_type: costType.cost_type,
                value: 0,
                date: new Date().toISOString().split('T')[0],
                notes: `Criado automaticamente pela venda ${resolvedSaleNumber}`,
                refinement_code: `REF-${resolvedSaleNumber}-${item.product_id}`,
                refinement_name: `Venda ${resolvedSaleNumber}`,
                locked_by_sale: saleId,
                quantity: item.quantity,
                cost_category: 'sale',
              })
            }
          } catch (error: any) {
            console.error(`Erro ao criar custos para item ${item.product_name}:`, error)
            const msg = error?.response?.data ? JSON.stringify(error.response.data) : error?.message
            costErrors.push(`${item.product_name}: ${msg}`)
          }
        }
        if (costErrors.length > 0) {
          alert(`Venda salva, mas houve erro ao criar custos:\n\n${costErrors.join('\n')}`)
        }
      }

      setSaving(false)
      onSave()
    } catch (error: any) {
      setSaving(false)
      console.error("Erro ao criar venda:", error)
      
      const responseData = error.response?.data
      if (responseData?.stock) {
        const msgs = Array.isArray(responseData.stock) ? responseData.stock : [responseData.stock]
        alert(msgs.join('\n'))
      } else {
        let errorMessage = "Erro ao criar venda"
        if (responseData) {
          errorMessage = JSON.stringify(responseData, null, 2)
        } else if (error.message) {
          errorMessage = error.message
        }
        alert(`Erro ao criar venda:\n\n${errorMessage}`)
      }
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
                <div className="relative flex-1" ref={customerRef}>
                  <input
                    type="text"
                    className="erp-input w-full"
                    placeholder="Buscar por nome..."
                    value={customerQuery !== "" ? customerQuery : (selectedCustomer ? selectedCustomer.name : "")}
                    onChange={(e) => {
                      setCustomerQuery(e.target.value)
                      setCustomerOpen(true)
                      if (!e.target.value) setFormData({ ...formData, customer_id: "" })
                    }}
                    onFocus={() => setCustomerOpen(true)}
                    onBlur={() => setTimeout(() => setCustomerOpen(false), 150)}
                  />
                  {customerOpen && filteredCustomers.length > 0 && (
                    <div className="absolute z-50 w-full erp-outset bg-white shadow-md" style={{ maxHeight: '150px', overflowY: 'auto', top: '100%' }}>
                      {filteredCustomers.map(c => (
                        <div
                          key={c.id}
                          className="px-2 py-1 text-[11px] cursor-pointer hover:bg-[#000080] hover:text-white"
                          onMouseDown={() => {
                            setFormData({ ...formData, customer_id: c.id.toString() })
                            setCustomerQuery("")
                            setCustomerOpen(false)
                          }}
                        >
                          {c.code} - {c.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                  <option value="uniforme">Venda - Uniforme</option>
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
                  <option value="transferencia">Transferência</option>
                </select>
              </FormField>
              <FormField label="Status:" inline>
                {formData.sale_type === 'uniforme' ? (
                  <span className="erp-input text-[11px] text-gray-600">
                    {uniformeAutoStatus === 'liquidado' ? '✅ Liquidado' : '🔄 Em Produção'}
                    <span className="ml-1 text-[9px]">(auto)</span>
                  </span>
                ) : (
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
                )}
              </FormField>
            </div>
          </FieldGroup>

          <FieldGroup label="Adicionar Item">
            <div className="space-y-2">
              <FormField label="Produto:" inline>
                <div className="relative flex-1" ref={productRef}>
                  <input
                    type="text"
                    className="erp-input w-full"
                    placeholder="Buscar por nome..."
                    value={productQuery !== "" ? productQuery : (safeProducts.find(p => p.id.toString() === newItem.product_id)?.name || "")}
                    onChange={(e) => {
                      setProductQuery(e.target.value)
                      setProductOpen(true)
                      if (!e.target.value) setNewItem({ ...newItem, product_id: "", unit_price: 0 })
                    }}
                    onFocus={() => setProductOpen(true)}
                    onBlur={() => setTimeout(() => setProductOpen(false), 150)}
                  />
                  {productOpen && filteredProducts.length > 0 && (
                    <div className="absolute z-50 w-full erp-outset bg-white shadow-md" style={{ maxHeight: '150px', overflowY: 'auto', top: '100%' }}>
                      {filteredProducts.map(p => (
                        <div
                          key={p.id}
                          className="px-2 py-1 text-[11px] cursor-pointer hover:bg-[#000080] hover:text-white"
                          onMouseDown={() => {
                            const price = p.selling_price ? Number(p.selling_price) : 0
                            setNewItem({ ...newItem, product_id: p.id.toString(), unit_price: price })
                            setProductQuery("")
                            setProductOpen(false)
                          }}
                        >
                          {p.code} - {p.name} (Est: {p.current_stock})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FormField>
              <FormField label="Valor de venda:" inline>
                <input
                  type="text"
                  className="erp-input w-32"
                  disabled={!isAdmin}
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
              <FormField label="Criar Refinamento:" inline>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={newItem.create_refinement}
                    onChange={(e) => setNewItem({ ...newItem, create_refinement: e.target.checked })}
                    disabled={!newItem.product_id}
                  />
                  <span className="text-[11px] text-gray-600">
                    {newItem.create_refinement 
                      ? "✓ Será criado custo de produção vinculado a esta venda" 
                      : "Usar custo original do produto"}
                  </span>
                </div>
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
              ...(isAdmin ? [
                {
                  key: "unit_price",
                  header: "Preço Unit.",
                  width: "90px",
                  align: "right" as const,
                  render: (item: any) => `R$ ${Number(item.unit_price).toFixed(2)}`,
                },
                {
                  key: "unit_cost",
                  header: "Custo Unit.",
                  width: "90px",
                  align: "right" as const,
                  render: (item: any) => `R$ ${Number(item.unit_cost).toFixed(2)}`,
                },
              ] : []),
              {
                key: "total_price",
                header: "Total",
                width: "90px",
                align: "right",
                render: (item) => `R$ ${Number(item.total_price).toFixed(2)}`,
              },
              ...(formData.sale_type === 'uniforme' ? [{
                key: "item_status",
                header: "Entrega",
                width: "110px",
                render: (item: any, index: any) => (
                  <select
                    className="erp-select text-[11px]"
                    style={{ backgroundColor: '#c0c0c0' }}
                    value={item.item_status}
                    onClick={(e: any) => e.stopPropagation()}
                    onChange={(e: any) => {
                      const ni = [...items]
                      ni[index] = { ...ni[index], item_status: e.target.value }
                      setItems(ni)
                    }}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="entregue">Entregue</option>
                  </select>
                ),
              }] : []),
              {
                key: "actions",
                header: formData.sale_type === 'uniforme' ? "" : "%",
                width: formData.sale_type === 'uniforme' ? "40px" : "110px",
                render: (item: any, index: any) => (
                  <div className="flex gap-1 justify-center items-center">
                    {formData.sale_type !== 'uniforme' && (
                      <div className="flex items-center gap-1" onClick={(e: any) => e.stopPropagation()}>
                        <input
                          type="number"
                          min="0"
                          max={maxDiscount}
                          step="1"
                          className="erp-input !w-12 text-[10px] text-center !p-0"
                          title={`Máx ${maxDiscount}%`}
                          value={item.discountPct ?? 0}
                          onChange={(e: any) => {
                            const pct = Math.min(Math.max(Number(e.target.value), 0), maxDiscount)
                            const ni = [...items]
                            const base = ni[index].quantity * ni[index].unit_price
                            const disc = (base * pct) / 100
                            ni[index] = { ...ni[index], discountPct: pct, discount: disc, total_price: base - disc + ni[index].tax + ni[index].freight }
                            setItems(ni)
                          }}
                        />
                        <span className="text-[10px]">%</span>
                      </div>
                    )}
                    <button type="button" className="erp-button !min-w-0 !p-1" onClick={() => removeItem(index)}>
                      🗑️
                    </button>
                  </div>
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

