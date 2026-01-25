"use client"

import { useState } from "react"
import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { Toolbar } from "@/components/erp/toolbar"
import { StatusBadge } from "@/components/erp/status-badge"
import { CustomerForm } from "@/components/customers/customer-form"
import type { Customer } from "@/lib/types"
import { customersApi } from "@/lib/api"

interface CustomersContentProps {
  initialCustomers: Customer[]
}

export function CustomersContent({ initialCustomers }: CustomersContentProps) {
  const [customers, setCustomers] = useState(Array.isArray(initialCustomers) ? initialCustomers : [])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState("")

  const refreshCustomers = async () => {
    try {
      const data = await customersApi.getAll()
      setCustomers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao atualizar clientes:", error)
    }
  }

  const handleNew = () => {
    setSelectedCustomer(null)
    setShowForm(true)
  }

  const handleEdit = () => {
    if (selectedCustomer) {
      setShowForm(true)
    }
  }

  const handleDelete = async () => {
    if (selectedCustomer && confirm("Deseja realmente excluir este cliente?")) {
      try {
        await customersApi.delete(selectedCustomer.id)
        await refreshCustomers()
        setSelectedCustomer(null)
        setSelectedIndex(undefined)
      } catch (error) {
        console.error("Erro ao excluir cliente:", error)
        alert("Erro ao excluir cliente")
      }
    }
  }

  const handleSave = async () => {
    await refreshCustomers()
    setShowForm(false)
    setSelectedCustomer(null)
    setSelectedIndex(undefined)
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.code.toLowerCase().includes(filter.toLowerCase()) ||
      (c.document && c.document.includes(filter)),
  )

  return (
    <div className="space-y-2">
      <ErpWindow title="Cadastro de Clientes">
        <Toolbar
          buttons={[
            { label: "Novo", icon: "➕", onClick: handleNew },
            { label: "Editar", icon: "✏️", onClick: handleEdit, disabled: !selectedCustomer },
            { label: "Excluir", icon: "🗑️", onClick: handleDelete, disabled: !selectedCustomer },
            { label: "Atualizar", icon: "🔄", onClick: refreshCustomers },
          ]}
        />

        <div className="flex gap-2 mb-2">
          <label className="text-[11px]">Filtrar:</label>
          <input
            type="text"
            className="erp-input flex-1"
            placeholder="Digite o código, nome ou documento..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <DataGrid
          columns={[
            { key: "code", header: "Código", width: "80px" },
            { key: "name", header: "Nome" },
            { key: "document", header: "CPF/CNPJ", width: "140px" },
            { key: "phone", header: "Telefone", width: "120px" },
            { 
              key: "zipcode", 
              header: "CEP", 
              width: "100px",
              render: (item) => item.zipcode || "-",
            },
            { 
              key: "address", 
              header: "Endereço",
              render: (item) => item.address || "-",
            },
            { 
              key: "neighborhood", 
              header: "Bairro",
              width: "120px",
              render: (item) => item.neighborhood || "-",
            },
            { 
              key: "city", 
              header: "Cidade", 
              width: "120px",
              render: (item) => item.city || "-",
            },
            { 
              key: "state", 
              header: "UF", 
              width: "40px",
              render: (item) => item.state || "-",
            },
            {
              key: "active",
              header: "Status",
              render: (item) => (
                <StatusBadge color={item.active ? "green" : "red"}>{item.active ? "ATIVO" : "INATIVO"}</StatusBadge>
              ),
            },
          ]}
          data={filteredCustomers}
          selectedIndex={selectedIndex}
          onRowClick={(item, index) => {
            setSelectedCustomer(item)
            setSelectedIndex(index)
          }}
        />

        <div className="mt-2 text-[11px] erp-inset p-1">Total de registros: {filteredCustomers.length}</div>
      </ErpWindow>

      {showForm && <CustomerForm customer={selectedCustomer} onSave={handleSave} onCancel={() => setShowForm(false)} />}
    </div>
  )
}

