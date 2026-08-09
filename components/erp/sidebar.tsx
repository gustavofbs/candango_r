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
    <div className="w-48 erp-outset h-full flex flex-col">
      <div className="erp-title-bar">
        <span>Menu Principal</span>
      </div>
      <div className="p-1 flex-1 overflow-auto">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-2 py-1 text-[11px] hover:bg-[#000080] hover:text-white ${
              pathname === item.href ? "bg-[#000080] text-white" : ""
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        {user?.is_staff && (
          <Link
            href="/usuarios"
            className={`block px-2 py-1 text-[11px] hover:bg-[#000080] hover:text-white ${
              pathname === "/usuarios" ? "bg-[#000080] text-white" : ""
            }`}
          >
            <span className="mr-2">👤</span>
            Usuários
          </Link>
        )}
      </div>
      <div className="p-1 border-t border-[#808080]">
        <div className="text-[10px] text-gray-600 px-2 py-1 truncate" title={user?.username}>
          👤 {displayName}
          {user?.is_staff && <span className="ml-1 text-[9px] text-[#000080]">(admin)</span>}
        </div>
        <button
          onClick={logout}
          className="w-full text-left px-2 py-1 text-[11px] hover:bg-[#000080] hover:text-white"
        >
          🚪 Sair
        </button>
      </div>
    </div>
  )
}
