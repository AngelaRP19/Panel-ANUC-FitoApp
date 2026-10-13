// Llamadas HTTP del feature "inicio" (pantalla de inicio del líder técnico).
// Endpoints propuestos: GET /panel/resumen · GET /panel/casos-por-categoria?periodo=
import { api } from '@/services/apiClient'
import type { CasosPorCategoria, PeriodoCategorias, ResumenPanel } from './types'

export async function obtenerResumen(): Promise<ResumenPanel> {
  const { data } = await api.get<ResumenPanel>('/panel/resumen')
  return data
}

export async function obtenerCasosPorCategoria(
  periodo: PeriodoCategorias,
): Promise<CasosPorCategoria> {
  const { data } = await api.get<CasosPorCategoria>('/panel/casos-por-categoria', {
    params: { periodo },
  })
  return data
}
