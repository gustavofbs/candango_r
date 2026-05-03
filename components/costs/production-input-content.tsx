"use client"

import { useState, useMemo } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { Toolbar } from "@/components/erp/toolbar"
import { ProductionEntryForm } from "@/components/costs/production-entry-form"
import { EditCostsForm } from "@/components/costs/edit-costs-form"
import type { ProductionCost, Product } from "@/lib/types"
import { costsApi } from "@/lib/api"

interface ProductionRefinementGroup {
  refinement_code: string
  refinement_name: string
  product_id: number
  product_name: string
  product_code: string
  quantity: number | null
  date: string
  costs: { id: number; cost_type: string; value: number }[]
  total: number
}

interface ProductionInputContentProps {
  initialGroups: ProductionRefinementGroup[]
  products: Product[]
}

export function ProductionInputContent({ initialGroups, products }: ProductionInputContentProps) {
  const [groups, setGroups] = useState<ProductionRefinementGroup[]>(initialGroups)
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [costsToEdit, setCostsToEdit] = useState<ProductionCost[]>([])
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set())
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]
  })

  const refreshGroups = async () => {
    try {
      const data = await costsApi.getRefinements(undefined, true, "production")
      setGroups(Array.isArray(data) ? (data as unknown as ProductionRefinementGroup[]) : [])
    } catch (e) {
      console.error("Erro ao atualizar entradas de produção:", e)
    }
  }

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const d = new Date(g.date || g.refinement_code)
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      return d >= start && d <= end
    })
  }, [groups, startDate, endDate])

  const handleEditSelected = async () => {
    if (selectedCodes.size === 0) return
    const selected = filteredGroups.filter(g => selectedCodes.has(g.refinement_code))
    const reconstructed: ProductionCost[] = selected.flatMap(g =>
      g.costs.map(c => ({
        id: c.id,
        product: g.product_id,
        product_name: g.product_name,
        product_code: g.product_code,
        customer: null,
        customer_name: undefined,
        description: "",
        cost_type: c.cost_type,
        cost_type_display: c.cost_type,
        value: c.value,
        date: g.date || "",
        quantity: g.quantity,
        refinement_code: g.refinement_code,
        refinement_name: g.refinement_name,
        notes: null,
        is_locked: false,
        locked_by_sale: null,
        locked_by_sale_number: null,
        locked_by_sale_customer: null,
        locked_at: null,
        cost_category: "production",
        created_at: "",
        updated_at: "",
      } as ProductionCost))
    )
    setCostsToEdit(reconstructed)
    setShowEditForm(true)
  }

  const handleDelete = async () => {
    if (selectedCodes.size === 0) return
    if (!confirm(`Excluir ${selectedCodes.size} entrada(s)? O estoque será revertido.`)) return
    for (const code of Array.from(selectedCodes)) {
      await costsApi.deleteProductionGroup(code)
    }
    setSelectedCodes(new Set())
    await refreshGroups()
  }

  const allCostTypes = useMemo(() => {
    const types = new Set<string>()
    filteredGroups.forEach((g) => g.costs.forEach((c) => types.add(c.cost_type)))
    return Array.from(types)
  }, [filteredGroups])

  const resumo = useMemo(() => {
    const totals: Record<string, number> = {}
    filteredGroups.forEach(g => {
      if (!selectedCodes.has(g.refinement_code)) return
      const qty = Number(g.quantity ?? 1)
      g.costs.forEach(c => {
        totals[c.cost_type] = (totals[c.cost_type] ?? 0) + c.value * qty
      })
    })
    return totals
  }, [filteredGroups, selectedCodes])

  const columns = [
    {
      key: "select",
      header: "",
      width: "36px",
      render: (item: ProductionRefinementGroup) => (
        <input
          type="checkbox"
          checked={selectedCodes.has(item.refinement_code)}
          onChange={(e) => {
            const next = new Set(selectedCodes)
            if (e.target.checked) next.add(item.refinement_code)
            else next.delete(item.refinement_code)
            setSelectedCodes(next)
          }}
        />
      ),
    },
    {
      key: "code",
      header: "Código",
      width: "120px",
      render: (item: ProductionRefinementGroup) => item.refinement_code,
    },
    {
      key: "date",
      header: "Data",
      width: "90px",
      render: (item: ProductionRefinementGroup) => {
        if (!item.date) return "-"
        const [y, m, d] = item.date.split("-")
        return `${d}/${m}/${y}`
      },
    },
    {
      key: "product",
      header: "Produto",
      width: "180px",
      render: (item: ProductionRefinementGroup) =>
        item.product_code ? `${item.product_code} - ${item.product_name}` : item.product_name,
    },
    {
      key: "quantity",
      header: "Qtd",
      width: "60px",
      align: "right" as const,
      render: (item: ProductionRefinementGroup) =>
        item.quantity != null ? Math.round(Number(item.quantity)).toString() : "-",
    },
    ...allCostTypes.map((ct) => ({
      key: ct,
      header: ct,
      width: "100px",
      align: "right" as const,
      render: (item: ProductionRefinementGroup) => {
        const cost = item.costs.find((c) => c.cost_type === ct)
        return cost ? `R$ ${Number(cost.value).toFixed(2)}` : "-"
      },
    })),
    {
      key: "unit_total",
      header: "C. Unit. Total",
      width: "100px",
      align: "right" as const,
      render: (item: ProductionRefinementGroup) => `R$ ${Number(item.total).toFixed(2)}`,
    },
    {
      key: "batch_total",
      header: "Total Lote",
      width: "100px",
      align: "right" as const,
      render: (item: ProductionRefinementGroup) => {
        const qty = Number(item.quantity ?? 0)
        return `R$ ${(qty * Number(item.total)).toFixed(2)}`
      },
    },
  ]

  return (
    <div className="space-y-2">
      <ErpWindow title="Custos de Produção">
        <Toolbar
          buttons={[
            { label: "Nova Entrada", icon: "➕", onClick: () => setShowForm(true) },
            {
              label: "Editar Selecionados",
              icon: "✏️",
              onClick: handleEditSelected,
              disabled: selectedCodes.size === 0,
            },
            {
              label: "Excluir Selecionados",
              icon: "🗑️",
              onClick: handleDelete,
              disabled: selectedCodes.size === 0,
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

        <DataGrid
          maxHeight="320px"
          columns={columns}
          data={filteredGroups}
          emptyMessage="Nenhuma entrada no período selecionado."
        />

        {selectedCodes.size > 0 && (
          <div className="text-[11px] erp-inset p-2 mt-2">
            <div className="font-bold mb-1">Resumo ({selectedCodes.size} selecionado{selectedCodes.size > 1 ? "s" : ""}):</div>
            <div className="flex flex-wrap gap-4">
              {Object.entries(resumo).map(([type, total]) => (
                <div key={type}>
                  <span className="font-bold">{type}:</span> R$ {Number(total).toFixed(2)}
                </div>
              ))}
              <div>
                <span className="font-bold">Total Geral:</span> R$ {(Object.values(resumo) as number[]).reduce((a, b) => a + b, 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </ErpWindow>

      {showForm && (
        <ProductionEntryForm
          products={products}
          onSave={async () => { setShowForm(false); await refreshGroups() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {showEditForm && (
        <EditCostsForm
          costs={costsToEdit}
          customers={[]}
          products={products}
          onSave={async () => { setShowEditForm(false); setSelectedCodes(new Set()); await refreshGroups() }}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  )
}
