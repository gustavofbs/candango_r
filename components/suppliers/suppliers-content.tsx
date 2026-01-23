"use client"

import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { Toolbar } from "@/components/erp/toolbar"
import { StatusBadge } from "@/components/erp/status-badge"
import { SupplierForm } from "@/components/suppliers/supplier-form"
import type { Supplier } from "@/lib/types"
import { suppliersApi } from "@/lib/api"

interface SuppliersContentProps {
  initialSuppliers: Supplier[]
}

export function SuppliersContent({ initialSuppliers }: SuppliersContentProps) {
  const [suppliers, setSuppliers] = useState(Array.isArray(initialSuppliers) ? initialSuppliers : [])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState("")

  const refreshSuppliers = async () => {
    try {
      const data = await suppliersApi.getAll()
      console.log("Dados recebidos (já processados):", data)
      console.log("Quantidade:", data.length)
      const suppliersArray = Array.isArray(data) ? data : []
      console.log("Atualizando estado com:", suppliersArray.length, "fornecedores")
      setSuppliers(suppliersArray)
    } catch (error) {
      console.error("Erro ao atualizar fornecedores:", error)
    }
  }

  const handleNew = () => {
    setSelectedSupplier(null)
    setShowForm(true)
  }

  const handleEdit = () => {
    if (selectedSupplier) {
      setShowForm(true)
    }
  }

  const handleDelete = async () => {
    if (selectedSupplier && confirm("Deseja realmente excluir este fornecedor?")) {
      try {
        await suppliersApi.delete(selectedSupplier.id)
        await refreshSuppliers()
        setSelectedSupplier(null)
        setSelectedIndex(undefined)
      } catch (error) {
        console.error("Erro ao excluir fornecedor:", error)
        alert("Erro ao excluir fornecedor")
      }
    }
  }

  const handleSave = async () => {
    await refreshSuppliers()
    setShowForm(false)
    setSelectedSupplier(null)
    setSelectedIndex(undefined)
  }

  const filteredSuppliers = suppliers.filter(
    (s) => s.name.toLowerCase().includes(filter.toLowerCase()) || s.code.toLowerCase().includes(filter.toLowerCase()),
  )

  return (
    <div className="space-y-2">
      <ErpWindow title="Cadastro de Fornecedores">
        <Toolbar
          buttons={[
            { label: "Novo", icon: "➕", onClick: handleNew },
            { label: "Editar", icon: "✏️", onClick: handleEdit, disabled: !selectedSupplier },
            { label: "Excluir", icon: "🗑️", onClick: handleDelete, disabled: !selectedSupplier },
            { label: "Atualizar", icon: "🔄", onClick: refreshSuppliers },
          ]}
        />

        <div className="flex gap-2 mb-2">
          <label className="text-[11px]">Filtrar:</label>
          <input
            type="text"
            className="erp-input flex-1"
            placeholder="Digite o código ou nome..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <DataGrid
          columns={[
            { key: "code", header: "Código", width: "80px" },
            { key: "name", header: "Razão Social" },
            { key: "document", header: "CNPJ", width: "140px" },
            { key: "contact_name", header: "Contato", width: "140px" },
            { key: "phone", header: "Telefone", width: "120px" },
            { key: "city", header: "Cidade", width: "120px" },
            {
              key: "active",
              header: "Status",
              render: (item) => (
                <StatusBadge color={item.active ? "green" : "red"}>{item.active ? "ATIVO" : "INATIVO"}</StatusBadge>
              ),
            },
          ]}
          data={filteredSuppliers}
          selectedIndex={selectedIndex}
          onRowClick={(item, index) => {
            setSelectedSupplier(item)
            setSelectedIndex(index)
          }}
        />

        <div className="mt-2 text-[11px] erp-inset p-1">Total de registros: {filteredSuppliers.length}</div>
      </ErpWindow>

      {showForm && <SupplierForm supplier={selectedSupplier} onSave={handleSave} onCancel={() => setShowForm(false)} />}
    </div>
  )
}

