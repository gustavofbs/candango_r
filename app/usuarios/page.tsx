"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { UsersContent } from "@/components/users/users-content"

export default function UsuariosPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && !user.is_staff) {
      router.replace("/")
    }
  }, [user, isLoading, router])

  if (isLoading) return <div className="text-[11px] p-4">Carregando...</div>
  if (!user?.is_staff) return null

  return <UsersContent />
}
