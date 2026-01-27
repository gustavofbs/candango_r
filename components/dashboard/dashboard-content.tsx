"use client"

import { ErpWindow } from "@/components/erp/window"
import { DataGrid } from "@/components/erp/data-grid"
import { StatusBadge } from "@/components/erp/status-badge"
import type { Product, Sale } from "@/lib/types"

interface DashboardContentProps {
  totalProducts: number
  totalCustomers: number
  totalSuppliers: number
  lowStockProducts: Product[]
  recentSales: (Sale & { customer: { name: string } | null })[]
  monthlyResult: number
}

export function DashboardContent({
  totalProducts,
  totalCustomers,
  totalSuppliers,
  lowStockProducts,
  recentSales,
  monthlyResult,
}: DashboardContentProps) {
  return (
    <div className="space-y-2">
      <ErpWindow title="Dashboard - Visão Geral">
        <div className="grid grid-cols-5 gap-2 mb-4">
          <div className="erp-inset p-3 text-center">
            <div className="text-2xl font-bold text-[#000080]">{totalProducts}</div>
            <div className="text-[11px]">Produtos Cadastrados</div>
          </div>
          <div className="erp-inset p-3 text-center">
            <div className="text-2xl font-bold text-[#008000]">{totalCustomers}</div>
            <div className="text-[11px]">Clientes Ativos</div>
          </div>
          <div className="erp-inset p-3 text-center">
            <div className="text-2xl font-bold text-[#800080]">{totalSuppliers}</div>
            <div className="text-[11px]">Fornecedores</div>
          </div>
          <div className="erp-inset p-3 text-center">
            <div className="text-2xl font-bold text-[#ff0000]">{lowStockProducts.length}</div>
            <div className="text-[11px]">Estoque Baixo</div>
          </div>
          <div className="erp-inset p-3 text-center">
            <div className={`text-2xl font-bold ${monthlyResult >= 0 ? 'text-[#008000]' : 'text-[#ff0000]'}`}>
              R$ {monthlyResult.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-[11px]">Resultado Mensal</div>
          </div>
        </div>
      </ErpWindow>

      <div className="grid grid-cols-1 gap-2">
        <ErpWindow title="Produtos com Estoque Baixo">
          <DataGrid
            columns={[
              { key: "code", header: "Código", width: "80px" },
              { key: "name", header: "Produto" },
              {
                key: "current_stock",
                header: "Estoque",
                align: "right",
                render: (item) => (
                  <StatusBadge color={item.current_stock <= 0 ? "red" : "yellow"}>{item.current_stock}</StatusBadge>
                ),
              },
              { key: "min_stock", header: "Mínimo", align: "right" },
            ]}
            data={lowStockProducts}
            emptyMessage="Nenhum produto com estoque baixo"
          />
        </ErpWindow>
      </div>

      <ErpWindow title="Últimas Vendas">
        <DataGrid
          columns={[
            { key: "sale_number", header: "Nº Venda", width: "100px" },
            {
              key: "sale_date",
              header: "Data",
              width: "100px",
              render: (item) => new Date(item.sale_date).toLocaleDateString("pt-BR"),
            },
            {
              key: "customer",
              header: "Cliente",
              render: (item) => item.customer?.name || "Cliente não informado",
            },
            {
              key: "final_amount",
              header: "Valor",
              align: "right",
              render: (item) => `R$ ${Number(item.final_amount).toFixed(2)}`,
            },
            {
              key: "status",
              header: "Status",
              render: (item) => (
                <StatusBadge
                  color={item.status === "concluida" ? "green" : item.status === "pendente" ? "yellow" : "red"}
                >
                  {item.status.toUpperCase()}
                </StatusBadge>
              ),
            },
          ]}
          data={recentSales}
          emptyMessage="Nenhuma venda registrada"
        />
      </ErpWindow>
    </div>
  )
}
