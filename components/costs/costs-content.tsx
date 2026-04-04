"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { Toolbar } from "@/components/erp/toolbar"
import { StatusBadge } from "@/components/erp/status-badge"
import { RefinementForm } from "@/components/costs/refinement-form"
import { EditCostsForm } from "@/components/costs/edit-costs-form"
import type { ProductionCost, Product, Customer } from "@/lib/types"
import { costsApi } from "@/lib/api"

interface CostsContentProps {
  initialCosts: (ProductionCost & { product: { name: string; code: string } | null })[]
  products: Product[]
  customers: Customer[]
}

interface RefinementGroup {
  refinement_code: string
  refinement_name: string
  product_name: string
  product_code: string
  customer_name?: string
  date: string
  costs: { [key: string]: { description: string; value: number } }
  total: number
  sale_number?: string
  sale_customer?: string
}

export function CostsContent({ initialCosts, products, customers }: CostsContentProps) {
  const [costs, setCosts] = useState(Array.isArray(initialCosts) ? initialCosts : [])
  const [showRefinementForm, setShowRefinementForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [costsToEdit, setCostsToEdit] = useState<ProductionCost[]>([])
  const [filter, setFilter] = useState("")
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(1)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const date = new Date()
    return date.toISOString().split('T')[0]
  })
  const [filterStatus, setFilterStatus] = useState<'all' | 'liquidated' | 'pending' | null>(null)
  const [selectedCosts, setSelectedCosts] = useState<Set<string>>(new Set())

  const refreshCosts = async () => {
    try {
      const data = await costsApi.getAll()
      setCosts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao atualizar custos:", error)
    }
  }

  const handleSaveRefinement = async () => {
    setShowRefinementForm(false)
    await refreshCosts()
  }

  const handleSaveEdit = async () => {
    setShowEditForm(false)
    setSelectedCosts(new Set())
    await refreshCosts()
  }

  const handleEditSelected = () => {
    if (selectedCosts.size === 0) {
      alert('Selecione pelo menos um custo para editar')
      return
    }

    // Busca todos os custos dos refinamentos selecionados
    const costsToEditList = costs.filter(c => {
      const refCode = c.refinement_code || `SINGLE-${c.id}`
      return selectedCosts.has(refCode)
    })

    setCostsToEdit(costsToEditList)
    setShowEditForm(true)
  }

  const handleDeleteSelected = async () => {
    if (selectedCosts.size === 0) {
      alert('Selecione pelo menos um custo para excluir')
      return
    }

    if (!confirm(`Deseja realmente excluir ${selectedCosts.size} custo(s) selecionado(s)?`)) return

    try {
      // Busca todos os custos dos refinamentos selecionados e exclui
      const costsToDelete = costs.filter(c => {
        const refCode = c.refinement_code || `SINGLE-${c.id}`
        return selectedCosts.has(refCode)
      })

      for (const cost of costsToDelete) {
        await costsApi.delete(cost.id)
      }

      alert('Custos excluídos com sucesso!')
      setSelectedCosts(new Set())
      await refreshCosts()
    } catch (error) {
      console.error('Erro ao excluir custos:', error)
      alert('Erro ao excluir custos')
    }
  }

  // Agrupa custos por refinement_code
  const refinementGroups = useMemo(() => {
    const groups: { [key: string]: RefinementGroup } = {}

    costs.forEach((cost) => {
      const refCode = cost.refinement_code || `SINGLE-${cost.id}`
      
      if (!groups[refCode]) {
        groups[refCode] = {
          refinement_code: refCode,
          refinement_name: cost.refinement_name || "Custo Individual",
          product_name: cost.product_name || "-",
          product_code: cost.product?.code || "-",
          customer_name: cost.customer_name || undefined,
          date: cost.date,
          costs: {},
          total: 0,
          sale_number: cost.locked_by_sale_number || undefined,
          sale_customer: cost.locked_by_sale_customer || undefined,
        }
      }

      groups[refCode].costs[cost.cost_type] = {
        description: cost.description,
        value: Number(cost.value),
      }
      groups[refCode].total += Number(cost.value)
    })

    return Object.values(groups)
  }, [costs])

  // Filtra grupos por mês, texto e status de liquidação
  const filteredGroups = refinementGroups.filter((g) => {
    // Se nenhum filtro de status foi selecionado, não mostra nada
    if (filterStatus === null) return false

    // Filtro de texto (sempre aplica se houver filtro)
    if (filter) {
      const matchesText =
        g.product_name?.toLowerCase().includes(filter.toLowerCase()) ||
        g.refinement_name?.toLowerCase().includes(filter.toLowerCase())
      
      if (!matchesText) return false
    }

    // Filtro de período (sempre aplica)
    const costDate = new Date(g.date)
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    const matchesDate = costDate >= start && costDate <= end
    
    if (!matchesDate) return false

    // Filtro de status
    if (filterStatus === 'liquidated') {
      // Liquidado = tem venda associada (locked_by_sale)
      return g.sale_number !== undefined
    } else if (filterStatus === 'pending') {
      // Pendente = NÃO tem venda associada
      return g.sale_number === undefined
    }
    // filterStatus === 'all' mostra todos
    
    return true
  })

  // Agrupa refinamentos por conjunto único de tipos de custo
  const groupedByColumns = useMemo(() => {
    const columnGroups: { [key: string]: RefinementGroup[] } = {}

    filteredGroups.forEach((group) => {
      const costTypes = Object.keys(group.costs).sort().join(",")
      if (!columnGroups[costTypes]) {
        columnGroups[costTypes] = []
      }
      columnGroups[costTypes].push(group)
    })

    return Object.entries(columnGroups).map(([costTypes, groups]) => ({
      costTypes: costTypes.split(","),
      groups,
    }))
  }, [filteredGroups])

  const costTypeLabels: Record<string, string> = {
    aviamentos: "Aviamentos",
    corte_tecido: "Corte Tecido",
    costura: "Costura",
    dtf: "DTF",
    embalagem: "Embalagem",
    etiqueta: "Etiqueta",
    silk: "Silk",
    sublimacao: "Sublimação",
    tipo_tecido: "Tipo Tecido",
  }

  return (
    <div className="space-y-2">
      <ErpWindow title="Custos de Produção">
        <Toolbar
          buttons={[
            { label: "Novo Custo", icon: "➕", onClick: () => setShowRefinementForm(true) },
            { 
              label: "Pendentes", 
              icon: "⏳", 
              onClick: () => setFilterStatus('pending'),
              active: filterStatus === 'pending'
            },
            { 
              label: "Liquidados", 
              icon: "✅", 
              onClick: () => setFilterStatus('liquidated'),
              active: filterStatus === 'liquidated'
            },
            { label: "Atualizar", icon: "🔄", onClick: refreshCosts },
            { 
              label: "Editar Selecionados", 
              icon: "✏️", 
              onClick: handleEditSelected,
              disabled: selectedCosts.size === 0
            },
            { 
              label: "Excluir Selecionados", 
              icon: "🗑️", 
              onClick: handleDeleteSelected,
              disabled: selectedCosts.size === 0
            },
          ]}
        />

        <div className="flex gap-2 mb-2 items-center">
          <label className="text-[11px]">Data Início:</label>
          <input
            type="date"
            className="erp-input w-32"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label className="text-[11px] ml-2">Data Fim:</label>
          <input
            type="date"
            className="erp-input w-32"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {groupedByColumns.map((columnGroup, groupIndex) => {
            const columns = [
              {
                key: "select",
                header: "",
                width: "40px",
                render: (item: RefinementGroup) => (
                  <input
                    type="checkbox"
                    checked={selectedCosts.has(item.refinement_code)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedCosts)
                      if (e.target.checked) {
                        newSelected.add(item.refinement_code)
                      } else {
                        newSelected.delete(item.refinement_code)
                      }
                      setSelectedCosts(newSelected)
                    }}
                  />
                ),
              },
              {
                key: "sale_code",
                header: "Código",
                width: "80px",
                render: (item: RefinementGroup) => item.sale_number || "-",
              },
              {
                key: "date",
                header: "Data",
                width: "100px",
                render: (item: RefinementGroup) => new Date(item.date).toLocaleDateString("pt-BR"),
              },
              {
                key: "cliente",
                header: "Cliente",
                width: "150px",
                render: (item: RefinementGroup) => item.customer_name || "-",
              },
              {
                key: "product",
                header: "Produto",
                width: "150px",
                render: (item: RefinementGroup) => `${item.product_code} - ${item.product_name}`,
              },
              ...columnGroup.costTypes.map((costType) => ({
                key: costType,
                header: costTypeLabels[costType] || costType,
                width: "100px",
                align: "right" as const,
                render: (item: RefinementGroup) =>
                  item.costs[costType] ? `R$ ${item.costs[costType].value.toFixed(2)}` : "-",
              })),
              {
                key: "total",
                header: "Total",
                width: "100px",
                align: "right" as const,
                render: (item: RefinementGroup) => `R$ ${item.total.toFixed(2)}`,
              },
            ]

            // Determina o título do grupo baseado nas vendas
            const firstGroup = columnGroup.groups[0]
            let groupTitle = ""
            // Pendente = não tem venda associada (locked_by_sale)
            const isPending = !firstGroup.sale_number
            
            if (firstGroup.sale_customer) {
              groupTitle = `Cliente: ${firstGroup.sale_customer}`
            } else {
              groupTitle = "Venda Pendente"
            }


            return (
              <div key={groupIndex} className="mb-4">
                <div className="text-[11px] font-bold mb-1 px-1">
                  {groupTitle}
                </div>
                <DataGrid columns={columns} data={columnGroup.groups} />
              </div>
            )
          })
        }
      </ErpWindow>

      {showRefinementForm && (
        <RefinementForm
          products={products}
          customers={customers}
          onSave={handleSaveRefinement}
          onCancel={() => setShowRefinementForm(false)}
        />
      )}

      {showEditForm && (
        <EditCostsForm
          costs={costsToEdit}
          customers={customers}
          products={products}
          onSave={handleSaveEdit}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  )
}
