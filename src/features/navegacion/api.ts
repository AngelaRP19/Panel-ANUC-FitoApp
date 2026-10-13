// Contadores de la barra lateral. Endpoint propuesto: GET /resumen/navegacion
import { api } from '@/services/apiClient'

export interface ResumenNavegacion {
  /** Líder: pendientes de revisión (sin técnico). Técnico: sus casos en revisión. */
  casos_pendientes: number
  /** Alertas generadas sin revisar (solo líder). */
  alertas_generadas: number
  /** Contador de la campana. */
  notificaciones_nuevas: number
  /** Líder técnico activo (el técnico le pide los casos que no tiene asignados). */
  lider: { nombre: string } | null
}

export async function obtenerResumenNavegacion(): Promise<ResumenNavegacion> {
  const { data } = await api.get<ResumenNavegacion>('/resumen/navegacion')
  return data
}
