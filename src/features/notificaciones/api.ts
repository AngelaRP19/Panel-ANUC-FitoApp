// Llamadas HTTP del feature "notificaciones" (campana · pantalla 18).
// Endpoints: GET /notificaciones (últimos 7 días del usuario) · POST /notificaciones/leidas
import { api } from '@/services/apiClient'

export interface Notificacion {
  id: string
  tipo: string
  titulo: string
  texto: string
  /** Ruta del panel a la que lleva el aviso. */
  enlace: string
  en: string
  leida: boolean
}

export interface ListaNotificaciones {
  items: Notificacion[]
  nuevas: number
}

export async function listarNotificaciones(): Promise<ListaNotificaciones> {
  const { data } = await api.get<ListaNotificaciones>('/notificaciones')
  return data
}

export async function marcarNotificacionesLeidas(): Promise<void> {
  await api.post('/notificaciones/leidas')
}
