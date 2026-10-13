// Llamadas HTTP del feature "auth". El inicio de sesión lo resuelve el proveedor de identidad
// (services/auth); aquí solo van los endpoints propios del backend.
// Endpoints: GET /auth/estado · POST /auth/primer-lider (pantalla 2)
import { api } from '@/services/apiClient'

export interface EstadoAuth {
  /** false: aún no existe ningún líder técnico y el login lleva a /primer-uso (RQF01). */
  hay_lider: boolean
}

export async function obtenerEstadoAuth(): Promise<EstadoAuth> {
  const { data } = await api.get<EstadoAuth>('/auth/estado')
  return data
}

export interface DatosPrimerLider {
  nombre: string
  correo: string
  /** E.164 (+573134027781) */
  celular: string
  password: string
}

/** Crea la cuenta del primer líder técnico (RQF01). 409 si ya hay líder o hay datos duplicados. */
export async function crearPrimerLider(datos: DatosPrimerLider): Promise<void> {
  await api.post('/auth/primer-lider', datos)
}
