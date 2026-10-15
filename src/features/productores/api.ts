// Llamadas HTTP del feature "productores" (RQF07-10). Único lugar del feature que usa `api`.
// Endpoints: GET /productores · GET /productores/resumen · GET /productores/{id}
//            POST /productores · PATCH /productores/{id} · PATCH /productores/{id}/estado
//            Acciones masivas (pantalla 21): GET /productores/exportar (CSV)
//            POST /productores/estado { ids, activo } · POST /productores/mensaje { ids, mensaje }
import type { Pagina } from '@/features/casos'
import { api } from '@/services/apiClient'
import type { DatosProductor, FiltrosProductores, Productor, ResumenProductores } from './types'

export async function listarProductores(f: FiltrosProductores): Promise<Pagina<Productor>> {
  const params: Record<string, string | number> = {
    page: Number(f.page) || 1,
    page_size: Number(f.filas) || 10,
  }
  Object.assign(params, paramsFiltros(f))
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

/** Parámetros de la lista según los filtros (los mismos de la tabla). */
function paramsFiltros(f: FiltrosProductores) {
  const params: Record<string, string> = {}
  if (f.q) params.q = f.q
  if (f.estado) params.estado = f.estado
  if (f.vereda) params.vereda = f.vereda
  if (f.especie) params.especie = f.especie
  if (f.casos) params.con_casos = f.casos
  if (f.finca) params.finca = f.finca
  if (f.desde) params.desde = f.desde
  if (f.hasta) params.hasta = f.hasta
  if (f.consulta) params.consulta = f.consulta
  return params
}

/** CSV de la selección (`ids`) o de la lista filtrada. Devuelve el texto del archivo. */
export async function exportarProductores(
  origen: { ids: string[] } | { filtros: FiltrosProductores },
): Promise<string> {
  const params = 'ids' in origen ? { ids: origen.ids.join(',') } : paramsFiltros(origen.filtros)
  const { data } = await api.get<string>('/productores/exportar', {
    params,
    responseType: 'text',
  })
  return data
}

/** Activa o desactiva varios productores (acciones masivas, pantalla 21). */
export async function cambiarEstadoProductores(
  ids: string[],
  activo: boolean,
): Promise<{ actualizados: number; solicitados: number }> {
  const { data } = await api.post<{ actualizados: number; solicitados: number }>(
    '/productores/estado',
    { ids, activo },
  )
  return data
}

/** Envía un mensaje por WhatsApp a los productores elegidos (solo a los activos). */
export async function enviarMensajeProductores(
  ids: string[],
  mensaje: string,
): Promise<{ enviados: number; omitidos: number }> {
  const { data } = await api.post<{ enviados: number; omitidos: number }>('/productores/mensaje', {
    ids,
    mensaje,
  })
  return data
}

/** Un productor deshabilitado no puede consultar por WhatsApp ni recibe mensajes de alerta. */
export async function cambiarEstadoProductor(id: string, activo: boolean): Promise<Productor> {
  const { data } = await api.patch<Productor>(`/productores/${encodeURIComponent(id)}/estado`, {
    activo,
  })
  return data
}
