import axios, { type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from "axios"

const getBaseURL = () => {
  if (typeof window === 'undefined') {
    return process.env.API_URL || "http://backend:8000/api"
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
}

const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      document.cookie = 'access_token=; Max-Age=0; path=/'
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
