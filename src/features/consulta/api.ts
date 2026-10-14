// Llamadas HTTP del feature "consulta" (RQF10, RQF14, RQF17). Único lugar del feature que usa `api`.
// Endpoints: GET /consulta/productores-fincas?q&vereda&especie&estado_casos&page
//            GET /consulta/productores-fincas/{id}
// El backend filtra por los casos asignados al técnico de la sesión.
import { api } from '@/services/apiClient'
import type { FiltrosConsulta, ListaConsulta, RegistroConsulta } from './types'

export async function listarConsulta(f: FiltrosConsulta): Promise<ListaConsulta> {
  const params: Record<string, string | number> = { page: Number(f.page) || 1, page_size: 10 }
  for (const clave of ['q', 'vereda', 'especie', 'estado_casos'] as const) {
    if (f[clave]) params[clave] = f[clave]
  }
  const { data } = await api.get<ListaConsulta>('/consulta/productores-fincas', { params })
  return data
}

export async function obtenerRegistro(id: string): Promise<RegistroConsulta> {
  const { data } = await api.get<RegistroConsulta>(
    `/consulta/productores-fincas/${encodeURIComponent(id)}`,
  )
  return data
}
