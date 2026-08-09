import apiClient from "./client"

export interface AppUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_active: boolean
  date_joined: string
  allowed_pages: string[] | null
}

export interface CreateUserPayload {
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_active: boolean
  password: string
  password_confirm: string
}

export interface UpdateUserPayload {
  username?: string
  email?: string
  first_name?: string
  last_name?: string
  is_staff?: boolean
  is_active?: boolean
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
  new_password_confirm: string
}

export interface ResetPasswordPayload {
  new_password: string
}

export const usersApi = {
  getAll: async (): Promise<AppUser[]> => {
    const response = await apiClient.get('/users/')
    return response.data.results ?? response.data
  },

  getMe: async (): Promise<AppUser> => {
    const response = await apiClient.get('/users/me/')
    return response.data
  },

  create: async (data: CreateUserPayload): Promise<AppUser> => {
    const response = await apiClient.post('/users/', data)
    return response.data
  },

  update: async (id: number, data: UpdateUserPayload): Promise<AppUser> => {
    const response = await apiClient.patch(`/users/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}/`)
  },

  changePassword: async (id: number, data: ChangePasswordPayload): Promise<void> => {
    await apiClient.post(`/users/${id}/change_password/`, data)
  },

  resetPassword: async (id: number, data: ResetPasswordPayload): Promise<void> => {
    await apiClient.post(`/users/${id}/reset_password/`, data)
  },

  setPermissions: async (id: number, allowed_pages: string[] | null): Promise<AppUser> => {
    const response = await apiClient.post(`/users/${id}/set_permissions/`, { allowed_pages })
    return response.data
  },
}
