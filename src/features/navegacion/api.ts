// Contadores de la barra lateral. Endpoint propuesto: GET /resumen/navegacion
import { api } from '@/services/apiClient'

export interface ResumenNavegacion {
  /** Líder: pendientes de revisión (sin técnico). Técnico: sus casos en revisión. */
  casos_pendientes: number
  /** Alertas generadas sin revisar (solo líder). */
  alertas_generadas: number
}

export async function obtenerResumenNavegacion(): Promise<ResumenNavegacion> {
  const { data } = await api.get<ResumenNavegacion>('/resumen/navegacion')
  return data
}
