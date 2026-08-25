"use client"

import { useEffect } from "react"
import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { useAuth } from "@/contexts/auth-context"

const PROTECTED_PATHS = [
  '/', '/produtos', '/categorias', '/clientes', '/fornecedores',
  '/vendas', '/despesas', '/custos', '/custos-producao', '/relatorios', '/empresa',
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { isLoading, isAuthenticated, user } = useAuth()
  const isLoginPage = pathname === '/login'

  const hasPageAccess = !isAuthenticated || !user || user.is_staff || (
    pathname !== '/' && (
      user.allowed_pages === null ||
      user.allowed_pages === undefined ||
      !PROTECTED_PATHS.includes(pathname) ||
      (Array.isArray(user.allowed_pages) && user.allowed_pages.includes(pathname))
    )
  )

  useEffect(() => {
    if (!isLoginPage && !isLoading && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [isLoginPage, isLoading, isAuthenticated])

  useEffect(() => {
    if (!isLoginPage && !isLoading && isAuthenticated && !hasPageAccess) {
      const firstAllowed = Array.isArray(user?.allowed_pages) && user.allowed_pages.length > 0
        ? user.allowed_pages[0]
        : '/produtos'
      window.location.href = firstAllowed
    }
  }, [isLoginPage, isLoading, isAuthenticated, hasPageAccess, pathname, user])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#c0c0c0] flex items-center justify-center">
        <div className="erp-outset p-4 text-[11px]">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <Sidebar />
      <main className="flex-1 p-2 overflow-auto">
        {children}
      </main>
    </div>
  )
}
