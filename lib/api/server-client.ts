import axios from 'axios'
import { cookies } from 'next/headers'

async function getToken(): Promise<string | null> {
  try {
    const store = await cookies()
    return store.get('access_token')?.value ?? null
  } catch {
    return null
  }
}

export async function serverGet<T = any>(path: string): Promise<T> {
  const token = await getToken()
  const baseURL = process.env.API_URL || 'http://backend:8000/api'
  try {
    const response = await axios.get(`${baseURL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    return response.data.results ?? response.data
  } catch {
    return [] as unknown as T
  }
}
