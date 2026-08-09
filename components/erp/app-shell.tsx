"use client"

import { useEffect } from "react"
import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { useAuth } from "@/contexts/auth-context"

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { isLoading, isAuthenticated } = useAuth()
  const isLoginPage = pathname === '/login'

  useEffect(() => {
    if (!isLoginPage && !isLoading && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [isLoginPage, isLoading, isAuthenticated])

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
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-2 overflow-auto">
        <div className="erp-outset p-1 mb-2">
          <div className="erp-title-bar">
            <span>Sistema de Controle de Estoque v1.0 - [Empresa: MINHA EMPRESA LTDA]</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
