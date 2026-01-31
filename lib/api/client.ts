import axios, { type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from "axios"

// Determinar a URL base correta
// No servidor (Server Components): usar URL interna do Docker
// No cliente (navegador): usar localhost
const getBaseURL = () => {
  // Se estamos no servidor (typeof window === 'undefined')
  if (typeof window === 'undefined') {
    // Usar URL interna do Docker para comunicação entre containers
    return process.env.API_URL || "http://backend:8000/api"
  }
  // Se estamos no cliente (navegador)
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
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized access")
    }
    return Promise.reject(error)
  }
)

export default apiClient
