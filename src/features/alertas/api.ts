// Llamadas HTTP del feature "alertas" (RQF26). Único lugar del feature que usa `api`.
// Endpoints: GET /alertas?estado&page · GET /alertas/{id} · POST /alertas/{id}/confirmar
//            POST /alertas/{id}/descartar { justificacion } · POST|DELETE /alertas/{id}/seguir
// Pendientes: parámetros (pantalla 13) y comunicar (pantalla 12).
import { api } from '@/services/apiClient'
import type { Alerta, FiltrosAlertas, ListaAlertas } from './types'

/** Tamaño de página de la lista (diseño 06: «6 por página»). */
export const ALERTAS_POR_PAGINA = 6

const ruta = (id: string) => `/alertas/${encodeURIComponent(id)}`

export async function listarAlertas(f: FiltrosAlertas): Promise<ListaAlertas> {
  const params: Record<string, string | number> = {
    page: Number(f.page) || 1,
    page_size: ALERTAS_POR_PAGINA,
  }
  if (f.estado) params.estado = f.estado
  const { data } = await api.get<ListaAlertas>('/alertas', { params })
  return data
}

export async function obtenerAlerta(id: string): Promise<Alerta> {
  const { data } = await api.get<Alerta>(ruta(id))
  return data
}

/** Solo líder. Después se redacta el mensaje para los productores (pantalla 12). */
export async function confirmarAlerta(id: string): Promise<Alerta> {
  const { data } = await api.post<Alerta>(`${ruta(id)}/confirmar`)
  return data
}

/** Solo líder. El motivo es obligatorio y queda en el historial. */
export async function descartarAlerta(id: string, justificacion: string): Promise<Alerta> {
  const { data } = await api.post<Alerta>(`${ruta(id)}/descartar`, { justificacion })
  return data
}

/** «Avisarme cuando cambie» (técnico): seguir o dejar de seguir la alerta. */
export async function seguirAlerta(id: string, seguir: boolean): Promise<Alerta> {
  const { data } = seguir
    ? await api.post<Alerta>(`${ruta(id)}/seguir`)
    : await api.delete<Alerta>(`${ruta(id)}/seguir`)
  return data
}
