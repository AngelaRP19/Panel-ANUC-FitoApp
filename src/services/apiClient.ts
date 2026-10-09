import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenStore } from '@/context/tokenStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true, // cookie del refresh token
})

/** Formato único de error del backend. */
export interface ApiErrorBody {
  error: { codigo: string; mensaje: string; campos: Record<string, string> }
}

export function isApiError(err: unknown): err is AxiosError<ApiErrorBody> {
  return axios.isAxiosError(err) && !!(err.response?.data as ApiErrorBody | undefined)?.error
}

api.interceptors.request.use((cfg) => {
  const t = tokenStore.get()
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

// 401 → un intento de /auth/refresh; si falla, limpiar sesión y redirigir a /login.
let refreshEnCurso: Promise<string> | null = null

async function refrescarToken(): Promise<string> {
  const { data } = await api.post<{ access_token: string }>('/auth/refresh')
  tokenStore.set(data.access_token)
  return data.access_token
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const esRutaAuth = original?.url?.startsWith('/auth/')
    if (error.response?.status !== 401 || !original || original._retry || esRutaAuth) {
      return Promise.reject(error)
    }
    original._retry = true
    try {
      refreshEnCurso ??= refrescarToken().finally(() => {
        refreshEnCurso = null
      })
      const token = await refreshEnCurso
      original.headers.Authorization = `Bearer ${token}`
      return api(original)
    } catch (e) {
      tokenStore.clear()
      window.location.assign('/login')
      return Promise.reject(e)
    }
  },
)
