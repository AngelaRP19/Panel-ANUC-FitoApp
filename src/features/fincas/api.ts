// Llamadas HTTP del feature "fincas" (RQF14-19). Único lugar del feature que usa `api`.
// Endpoints: GET /fincas · GET /fincas/resumen · GET /fincas/{id} · POST /fincas · PATCH /fincas/{id}
import type { Pagina } from '@/features/casos'
import { api } from '@/services/apiClient'
import type { DatosFinca, Finca, FiltrosFincas, ResumenFincas } from './types'

export async function listarFincas(f: FiltrosFincas): Promise<Pagina<Finca>> {
  const params: Record<string, string | number> = { page: Number(f.page) || 1, page_size: 10 }
  if (f.q) params.q = f.q
  if (f.vereda) params.vereda = f.vereda
  if (f.especie) params.especie = f.especie
  if (f.tipo) params.tipo = f.tipo
  if (f.casos) params.casos = f.casos
  if (f.productor) params.productor_id = f.productor
  const { data } = await api.get<Pagina<Finca>>('/fincas', { params })
  return data
}

export async function obtenerResumenFincas(): Promise<ResumenFincas> {
  const { data } = await api.get<ResumenFincas>('/fincas/resumen')
  return data
}

export async function obtenerFinca(id: string): Promise<Finca> {
  const { data } = await api.get<Finca>(`/fincas/${encodeURIComponent(id)}`)
  return data
}

/** Registrar finca: solo para un productor activo. */
export async function registrarFinca(datos: DatosFinca): Promise<Finca> {
  const { data } = await api.post<Finca>('/fincas', datos)
  return data
}

/**
 * Editar finca y cultivos. Si se quita una especie que usan casos activos responde 409
 * `ESPECIE_EN_USO` con `detalle: EspecieEnUso[]`; con `forzar: true` guarda de todas formas.
 */
export async function editarFinca(id: string, datos: DatosFinca): Promise<Finca> {
  const { data } = await api.patch<Finca>(`/fincas/${encodeURIComponent(id)}`, datos)
  return data
}
