"use client"

import { useState, useEffect } from "react"
import axios from "axios"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      window.location.href = '/'
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
      const { data } = await axios.post(`${baseURL}/token/`, { username, password })
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      document.cookie = `access_token=${data.access}; Max-Age=${8 * 3600}; path=/; SameSite=Lax`
      window.location.href = '/'
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setError(detail || "Usuário ou senha inválidos.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#c0c0c0]">
      <div className="erp-outset p-0" style={{ width: 340 }}>
        <div className="erp-title-bar">
          <span>Sistema de Controle de Estoque — Login</span>
        </div>
        <div className="p-6">
          <div className="text-center mb-5">
            <div className="text-4xl mb-2">🏢</div>
            <div className="text-[13px] font-bold text-gray-700">Acesso ao Sistema</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold mb-1">Usuário</label>
              <input
                type="text"
                className="erp-input w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Senha</label>
              <input
                type="password"
                className="erp-input w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="erp-inset p-2 text-[11px] text-red-700 bg-red-50">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              className="erp-button w-full"
              disabled={loading || !username || !password}
            >
              {loading ? "Aguarde..." : "🔐 Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
