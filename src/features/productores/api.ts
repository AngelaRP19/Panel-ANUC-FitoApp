// Llamadas HTTP del feature "productores" (RQF07-10). Único lugar del feature que usa `api`.
// Endpoints: GET /productores · GET /productores/resumen · GET /productores/{id}
//            POST /productores · PATCH /productores/{id} · PATCH /productores/{id}/estado
import type { Pagina } from '@/features/casos'
import { api } from '@/services/apiClient'
import type { DatosProductor, FiltrosProductores, Productor, ResumenProductores } from './types'

export async function listarProductores(f: FiltrosProductores): Promise<Pagina<Productor>> {
  const params: Record<string, string | number> = {
    page: Number(f.page) || 1,
    page_size: Number(f.filas) || 10,
  }
  if (f.q) params.q = f.q
  if (f.estado) params.estado = f.estado
  if (f.vereda) params.vereda = f.vereda
  if (f.especie) params.especie = f.especie
  if (f.casos) params.con_casos = f.casos
  if (f.finca) params.finca = f.finca
  if (f.desde) params.desde = f.desde
  if (f.hasta) params.hasta = f.hasta
  if (f.consulta) params.consulta = f.consulta
  const { data } = await api.get<Pagina<Productor>>('/productores', { params })
  return data
}

export async function obtenerResumenProductores(): Promise<ResumenProductores> {
  const { data } = await api.get<ResumenProductores>('/productores/resumen')
  return data
}

export async function obtenerProductor(id: string): Promise<Productor> {
  const { data } = await api.get<Productor>(`/productores/${encodeURIComponent(id)}`)
  return data
}

export async function registrarProductor(datos: DatosProductor): Promise<Productor> {
  const { data } = await api.post<Productor>('/productores', datos)
  return data
}

export async function editarProductor(id: string, datos: DatosProductor): Promise<Productor> {
  const { data } = await api.patch<Productor>(`/productores/${encodeURIComponent(id)}`, datos)
  return data
}

/** Un productor deshabilitado no puede consultar por WhatsApp ni recibe mensajes de alerta. */
export async function cambiarEstadoProductor(id: string, activo: boolean): Promise<Productor> {
  const { data } = await api.patch<Productor>(`/productores/${encodeURIComponent(id)}/estado`, {
    activo,
  })
  return data
}
