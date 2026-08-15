"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

const menuItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/produtos", label: "Produtos", icon: "📦" },
  { href: "/categorias", label: "Categorias", icon: "📁" },
  { href: "/clientes", label: "Clientes", icon: "👥" },
  { href: "/fornecedores", label: "Fornecedores", icon: "🏭" },
  { href: "/vendas", label: "Vendas", icon: "💰" },
  { href: "/despesas", label: "Despesas", icon: "💸" },
  { href: "/custos", label: "Custos de Venda", icon: "📋" },
  { href: "/custos-producao", label: "Custos de Produção", icon: "🏭" },
  { href: "/relatorios", label: "Relatórios", icon: "📄" },
  { href: "/empresa", label: "Empresa", icon: "🏢" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const displayName = user
    ? (user.first_name ? `${user.first_name}` : user.username)
    : ""

  const visibleItems = user?.is_staff
    ? menuItems
    : menuItems.filter(item =>
        user?.allowed_pages === null ||
        user?.allowed_pages === undefined ||
        (Array.isArray(user.allowed_pages) && user.allowed_pages.includes(item.href))
      )

  return (
    <div className="erp-outset">
      <div className="erp-title-bar">
        <span>Sistema de Controle de Estoque v1.0</span>
      </div>
      <div className="flex items-center flex-wrap">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-2 py-1 text-[11px] hover:bg-[#000080] hover:text-white whitespace-nowrap ${
              pathname === item.href ? "bg-[#000080] text-white" : ""
            }`}
          >
            <span className="mr-1">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        {user?.is_staff && (
          <Link
            href="/usuarios"
            className={`px-2 py-1 text-[11px] hover:bg-[#000080] hover:text-white whitespace-nowrap ${
              pathname === "/usuarios" ? "bg-[#000080] text-white" : ""
            }`}
          >
            <span className="mr-1">👤</span>
            Usuários
          </Link>
        )}
        <div className="ml-auto flex items-center gap-2 px-2 border-l border-[#808080]">
          <span className="text-[10px] text-gray-600 whitespace-nowrap" title={user?.username}>
            👤 {displayName}
            {user?.is_staff && <span className="ml-1 text-[9px] text-[#000080]">(admin)</span>}
          </span>
          <button
            onClick={logout}
            className="px-2 py-1 text-[11px] hover:bg-[#000080] hover:text-white whitespace-nowrap"
          >
            🚪 Sair
          </button>
        </div>
      </div>
    </div>
  )
}
