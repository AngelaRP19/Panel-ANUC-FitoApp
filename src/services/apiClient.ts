import axios, { type AxiosError } from 'axios'
import { env } from '@/config/env'
import { MENSAJES } from '@/locales/es'
import { obtenerToken } from '@/services/auth'

export const api = axios.create({ baseURL: env.apiUrl })

/**
 * Error normalizado de la API. Las pantallas muestran `mensaje` y marcan `campos`
 * en el formulario. `codigo` es 'RED' cuando no hubo respuesta del servidor.
 */
export class ErrorApi extends Error {
  readonly codigo: string
  readonly campos: Record<string, string>
  /** Código HTTP; null si no hubo respuesta (sin conexión). */
  readonly status: number | null

  constructor(params: {
    codigo: string
    mensaje: string
    campos?: Record<string, string>
    status: number | null
  }) {
    super(params.mensaje)
    this.name = 'ErrorApi'
    this.codigo = params.codigo
    this.campos = params.campos ?? {}
    this.status = params.status
  }
}

export function esErrorApi(error: unknown): error is ErrorApi {
  return error instanceof ErrorApi
}

/** Formato único de error del backend. */
interface CuerpoError {
  error?: { codigo?: string; mensaje?: string; campos?: Record<string, string> }
}

function normalizar(error: AxiosError<CuerpoError>): ErrorApi {
  if (!error.response) {
    return new ErrorApi({ codigo: 'RED', mensaje: MENSAJES.errorConexionTexto, status: null })
  }
  const cuerpo = error.response.data?.error
  return new ErrorApi({
    codigo: cuerpo?.codigo ?? `HTTP_${error.response.status}`,
    mensaje: cuerpo?.mensaje ?? MENSAJES.errorGenerico,
    campos: cuerpo?.campos,
    status: error.response.status,
  })
}

// Quien monta la sesión (AuthContext) decide qué hacer cuando el servidor rechaza el token.
let alExpirarSesion: (() => void) | null = null
export function registrarSesionExpirada(fn: (() => void) | null) {
  alExpirarSesion = fn
}

// 403/404 al pedir un caso: puede ser de otro técnico. Quien monta el panel decide si muestra
// «No tienes acceso a este caso» (el backend responde 404 para no revelar que el caso existe).
let alCasoInaccesible: ((idCaso: string, status: number) => void) | null = null
export function registrarCasoInaccesible(fn: ((idCaso: string, status: number) => void) | null) {
  alCasoInaccesible = fn
}

/** id del caso si la URL es `/casos/{id}` o un subrecurso (`/casos/{id}/evidencias`). */
function idCasoDeUrl(url: string | undefined): string | null {
  const m = url ? /^\/casos\/([^/?]+)/.exec(url) : null
  return m && m[1] !== 'conteos' ? decodeURIComponent(m[1]!) : null
}

api.interceptors.request.use(async (cfg) => {
  // El proveedor de identidad (Cognito) renueva el token si hace falta.
  const token = await obtenerToken()
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<CuerpoError>) => {
    const normalizado = normalizar(error)
    if (normalizado.status === 401) alExpirarSesion?.()
    if (normalizado.status === 403 || normalizado.status === 404) {
      const idCaso = idCasoDeUrl(error.config?.url)
      if (idCaso) alCasoInaccesible?.(idCaso, normalizado.status)
    }
    return Promise.reject(normalizado)
  },
)
