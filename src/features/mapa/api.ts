// Llamadas HTTP del feature "mapa" (pantalla 19 · Mapa de vigilancia · solo líder).
// Endpoint: GET /mapa/casos?especie&desde&hasta (aaaa-mm-dd): casos con resultado técnico
// Confirmado u Otra patología, con su ubicación y su nivel de concentración (1-4).
import { api } from '@/services/apiClient'
import type { Categoria, Especie, ResultadoTecnico, Vereda } from '@/types/enums'

export interface CasoMapa {
  id: string
  codigo: string
  categoria: Categoria
  resultado_tecnico: ResultadoTecnico
  especie: Especie
  productor_nombre: string
  finca_id: string
  finca_nombre: string
  vereda: Vereda
  /** Envío al panel. */
  fecha: string
  latitud: number
  longitud: number
  /** 1-4 para las categorías que participan en alertas; null si no participa. */
  concentracion: number | null
}

export interface DatosMapa {
  casos: CasoMapa[]
  conteos: Record<Categoria, number>
}

export type FiltrosMapa = {
  especie: string
  /** aaaa-mm-dd */
  desde: string
  hasta: string
  /** Categorías ocultas, separadas por coma. */
  ocultas: string
  /** '0': capa de concentración apagada. */
  calor: string
  /** Finca destacada (enlace «Ver en el mapa de vigilancia»). */
  finca: string
}

export async function obtenerCasosMapa(f: FiltrosMapa): Promise<DatosMapa> {
  const params: Record<string, string> = {}
  if (f.especie) params.especie = f.especie
  if (f.desde) params.desde = f.desde
  if (f.hasta) params.hasta = f.hasta
  const { data } = await api.get<DatosMapa>('/mapa/casos', { params })
  return data
}
