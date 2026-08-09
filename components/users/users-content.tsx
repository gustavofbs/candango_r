"use client"

import { useState, useEffect } from "react"
import { ErpWindow } from "@/components/erp/window"
import { usersApi } from "@/lib/api/users"
import type { AppUser } from "@/lib/api/users"
import { useAuth } from "@/contexts/auth-context"

type FormMode = "create" | "edit" | "change_password" | "permissions" | null

const ALL_PAGES = [
  { href: "/", label: "Dashboard" },
  { href: "/produtos", label: "Produtos" },
  { href: "/categorias", label: "Categorias" },
  { href: "/clientes", label: "Clientes" },
  { href: "/fornecedores", label: "Fornecedores" },
  { href: "/vendas", label: "Vendas" },
  { href: "/despesas", label: "Despesas" },
  { href: "/custos", label: "Custos de Venda" },
  { href: "/custos-producao", label: "Custos de Produção" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/empresa", label: "Empresa" },
]

interface UserFormState {
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_active: boolean
  password: string
  password_confirm: string
  old_password: string
  new_password: string
  new_password_confirm: string
}

const emptyForm = (): UserFormState => ({
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  is_staff: false,
  is_active: true,
  password: "",
  password_confirm: "",
  old_password: "",
  new_password: "",
  new_password_confirm: "",
})

export function UsersContent() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [mode, setMode] = useState<FormMode>(null)
  const [formData, setFormData] = useState<UserFormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [permPages, setPermPages] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await usersApi.getAll()
      setUsers(data)
    } catch (e: any) {
      setError("Erro ao carregar usuários.")
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setSelectedUser(null)
    setFormData(emptyForm())
    setError("")
    setSuccess("")
    setMode("create")
  }

  const openEdit = (u: AppUser) => {
    setSelectedUser(u)
    setFormData({
      ...emptyForm(),
      username: u.username,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      is_staff: u.is_staff,
      is_active: u.is_active,
    })
    setError("")
    setSuccess("")
    setMode("edit")
  }

  const openChangePassword = (u: AppUser) => {
    setSelectedUser(u)
    setFormData(emptyForm())
    setError("")
    setSuccess("")
    setMode("change_password")
  }

  const openPermissions = (u: AppUser) => {
    setSelectedUser(u)
    setError("")
    setSuccess("")
    if (u.allowed_pages === null || u.allowed_pages === undefined) {
      setPermPages(new Set(ALL_PAGES.map((p) => p.href)))
    } else {
      setPermPages(new Set(u.allowed_pages))
    }
    setMode("permissions")
  }

  const closeForm = () => {
    setMode(null)
    setSelectedUser(null)
    setError("")
    setSuccess("")
  }

  const set = (field: keyof UserFormState, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setError("")
    setSaving(true)
    try {
      if (mode === "create") {
        await usersApi.create({
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          is_staff: formData.is_staff,
          is_active: formData.is_active,
          password: formData.password,
          password_confirm: formData.password_confirm,
        })
        setSuccess("Usuário criado com sucesso.")
      } else if (mode === "edit" && selectedUser) {
        await usersApi.update(selectedUser.id, {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          is_staff: formData.is_staff,
          is_active: formData.is_active,
        })
        setSuccess("Usuário atualizado com sucesso.")
      } else if (mode === "change_password" && selectedUser) {
        if (currentUser?.is_staff && currentUser.id !== selectedUser.id) {
          await usersApi.resetPassword(selectedUser.id, { new_password: formData.new_password })
        } else {
          await usersApi.changePassword(selectedUser.id, {
            old_password: formData.old_password,
            new_password: formData.new_password,
            new_password_confirm: formData.new_password_confirm,
          })
        }
        setSuccess("Senha alterada com sucesso.")
      }
      await loadUsers()
      setTimeout(closeForm, 1200)
    } catch (e: any) {
      const data = e?.response?.data
      if (data && typeof data === "object") {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("\n")
        setError(msgs)
      } else {
        setError("Erro ao salvar.")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSavePermissions = async () => {
    if (!selectedUser) return
    setSaving(true)
    setError("")
    try {
      const allSelected = ALL_PAGES.every((p) => permPages.has(p.href))
      const pages = allSelected ? null : Array.from(permPages) as string[]
      await usersApi.setPermissions(selectedUser.id, pages)
      setSuccess("Permissões atualizadas com sucesso.")
      await loadUsers()
      setTimeout(closeForm, 1200)
    } catch {
      setError("Erro ao salvar permissões.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u: AppUser) => {
    if (!confirm(`Excluir o usuário "${u.username}"? Esta ação não pode ser desfeita.`)) return
    try {
      await usersApi.delete(u.id)
      await loadUsers()
      if (selectedUser?.id === u.id) closeForm()
    } catch {
      alert("Erro ao excluir usuário.")
    }
  }

  const isAdminChangingOtherPassword =
    mode === "change_password" &&
    currentUser?.is_staff &&
    selectedUser?.id !== currentUser?.id

  return (
    <div className="space-y-2">
      <ErpWindow title="Gestão de Usuários">
        <div className="flex gap-2 mb-2">
          <button className="erp-button" onClick={openCreate}>+ Novo Usuário</button>
          <button className="erp-button" onClick={loadUsers}>↺ Atualizar</button>
        </div>

        <div className="erp-inset overflow-auto" style={{ maxHeight: "350px" }}>
          <table className="erp-table">
            <thead>
              <tr>
                <th className="sticky top-0 bg-[#d4d0c8] z-10" style={{ width: "120px" }}>Usuário</th>
                <th className="sticky top-0 bg-[#d4d0c8] z-10" style={{ width: "150px" }}>Nome</th>
                <th className="sticky top-0 bg-[#d4d0c8] z-10" style={{ width: "180px" }}>E-mail</th>
                <th className="sticky top-0 bg-[#d4d0c8] z-10" style={{ width: "70px", textAlign: "center" }}>Admin</th>
                <th className="sticky top-0 bg-[#d4d0c8] z-10" style={{ width: "70px", textAlign: "center" }}>Ativo</th>
                <th className="sticky top-0 bg-[#d4d0c8] z-10" style={{ width: "160px", textAlign: "center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4 !bg-white">Carregando...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 !bg-white">Nenhum usuário encontrado</td></tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className={`cursor-pointer hover:!bg-[#000080] hover:!text-white ${
                      selectedUser?.id === u.id ? "!bg-[#000080] !text-white" : ""
                    }`}
                    onClick={() => setSelectedUser(u)}
                  >
                    <td>
                      {u.username}
                      {u.id === currentUser?.id && (
                        <span className="ml-1 text-[9px] opacity-70">(você)</span>
                      )}
                    </td>
                    <td>{[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}</td>
                    <td>{u.email || "—"}</td>
                    <td style={{ textAlign: "center" }}>{u.is_staff ? "✓" : ""}</td>
                    <td style={{ textAlign: "center" }}>{u.is_active ? "✓" : "✗"}</td>
                    <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="erp-button !min-w-0 !px-2 !py-0 !text-[10px] mr-1"
                        onClick={() => openEdit(u)}
                      >
                        Editar
                      </button>
                      <button
                        className="erp-button !min-w-0 !px-2 !py-0 !text-[10px] mr-1"
                        onClick={() => openChangePassword(u)}
                      >
                        Senha
                      </button>
                      {!u.is_staff && (
                        <button
                          className="erp-button !min-w-0 !px-2 !py-0 !text-[10px] mr-1"
                          onClick={() => openPermissions(u)}
                        >
                          Permissões
                        </button>
                      )}
                      {u.id !== currentUser?.id && (
                        <button
                          className="erp-button !min-w-0 !px-2 !py-0 !text-[10px]"
                          onClick={() => handleDelete(u)}
                        >
                          Excluir
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ErpWindow>

      {mode && (
        <ErpWindow
          title={
            mode === "create" ? "Novo Usuário" :
            mode === "edit" ? `Editar: ${selectedUser?.username}` :
            mode === "permissions" ? `Permissões: ${selectedUser?.username}` :
            `Alterar Senha: ${selectedUser?.username}`
          }
        >
          {error && (
            <div className="erp-inset p-2 mb-3 text-[11px] text-red-700 bg-red-50 whitespace-pre-wrap">
              ⚠ {error}
            </div>
          )}
          {success && (
            <div className="erp-inset p-2 mb-3 text-[11px] text-green-700 bg-green-50">
              ✓ {success}
            </div>
          )}

          <div className="space-y-2">
            {(mode === "create" || mode === "edit") && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Usuário *</label>
                    <input
                      className="erp-input w-full"
                      value={formData.username}
                      onChange={(e) => set("username", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">E-mail</label>
                    <input
                      className="erp-input w-full"
                      type="email"
                      value={formData.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Nome</label>
                    <input
                      className="erp-input w-full"
                      value={formData.first_name}
                      onChange={(e) => set("first_name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Sobrenome</label>
                    <input
                      className="erp-input w-full"
                      value={formData.last_name}
                      onChange={(e) => set("last_name", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_staff}
                      onChange={(e) => set("is_staff", e.target.checked)}
                    />
                    Administrador
                  </label>
                  <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => set("is_active", e.target.checked)}
                    />
                    Usuário Ativo
                  </label>
                </div>
                {mode === "create" && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#d4d0c8]">
                    <div>
                      <label className="block text-[11px] font-bold mb-1">Senha *</label>
                      <input
                        className="erp-input w-full"
                        type="password"
                        value={formData.password}
                        onChange={(e) => set("password", e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">Confirmar Senha *</label>
                      <input
                        className="erp-input w-full"
                        type="password"
                        value={formData.password_confirm}
                        onChange={(e) => set("password_confirm", e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {mode === "permissions" && selectedUser && (
              <div className="space-y-2">
                {selectedUser.is_staff ? (
                  <div className="text-[11px] text-gray-500 erp-inset p-2">
                    Administradores têm acesso a todas as telas automaticamente.
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] mb-2">
                      Selecione as telas que <b>{selectedUser.username}</b> pode acessar:
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {ALL_PAGES.map((page) => (
                        <label key={page.href} className="flex items-center gap-1 text-[11px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permPages.has(page.href)}
                            onChange={(e) => {
                              const next = new Set(permPages)
                              if (e.target.checked) next.add(page.href)
                              else next.delete(page.href)
                              setPermPages(next)
                            }}
                          />
                          {page.label}
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button
                        className="erp-button !text-[10px] !py-0"
                        onClick={() => setPermPages(new Set(ALL_PAGES.map((p) => p.href)))}
                      >
                        Selecionar Todos
                      </button>
                      <button
                        className="erp-button !text-[10px] !py-0"
                        onClick={() => setPermPages(new Set())}
                      >
                        Desmarcar Todos
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {mode === "change_password" && (
              <div className="space-y-2">
                {!isAdminChangingOtherPassword && (
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Senha Atual *</label>
                    <input
                      className="erp-input w-full"
                      type="password"
                      value={formData.old_password}
                      onChange={(e) => set("old_password", e.target.value)}
                    />
                  </div>
                )}
                {isAdminChangingOtherPassword && (
                  <div className="text-[11px] text-gray-500 erp-inset p-2">
                    Como administrador, você pode redefinir a senha sem informar a senha atual.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Nova Senha *</label>
                    <input
                      className="erp-input w-full"
                      type="password"
                      value={formData.new_password}
                      onChange={(e) => set("new_password", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Confirmar Nova Senha *</label>
                    <input
                      className="erp-input w-full"
                      type="password"
                      value={formData.new_password_confirm}
                      onChange={(e) => set("new_password_confirm", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                className="erp-button"
                onClick={mode === "permissions" ? handleSavePermissions : handleSave}
                disabled={saving}
              >
                {saving ? "Salvando..." : "💾 Salvar"}
              </button>
              <button className="erp-button" onClick={closeForm}>Cancelar</button>
            </div>
          </div>
        </ErpWindow>
      )}
    </div>
  )
}
