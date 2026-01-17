"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/produtos", label: "Produtos", icon: "📦" },
  { href: "/categorias", label: "Categorias", icon: "📁" },
  { href: "/clientes", label: "Clientes", icon: "👥" },
  { href: "/fornecedores", label: "Fornecedores", icon: "🏭" },
  { href: "/vendas", label: "Vendas", icon: "💰" },
  { href: "/custos", label: "Custos Produção", icon: "📋" },
  { href: "/movimentacoes", label: "Movimentações", icon: "🔄" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-48 erp-outset h-full">
      <div className="erp-title-bar">
        <span>Menu Principal</span>
      </div>
      <div className="p-1">
        {menuItems.map((item) => (
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
      </div>
    </div>
  )
}
