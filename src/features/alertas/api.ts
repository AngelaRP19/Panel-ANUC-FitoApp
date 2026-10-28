// Llamadas HTTP del feature "alertas" (RQF26). Único lugar del feature que usa `api`.
// Endpoints: GET /alertas?estado&page · GET /alertas/{id} · POST /alertas/{id}/confirmar
//            POST /alertas/{id}/descartar { justificacion } · POST|DELETE /alertas/{id}/seguir
//            GET /alertas/{id}/destinatarios · PUT /alertas/{id}/borrador
//            POST /alertas/{id}/comunicar { mensaje, veredas[] }
//            POST /alertas/{id}/corregir { mensaje }
//            GET /alertas/parametros · PUT /alertas/parametros/{categoria}
import { api } from '@/services/apiClient'
import type {
  Alerta,
  BorradorMensaje,
  DestinatariosVereda,
  FiltrosAlertas,
  ListaAlertas,
  ParametroCategoria,
  ParametrosAlerta,
} from './types'

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

/** Productores por vereda que pueden recibir el mensaje de la alerta. */
export async function obtenerDestinatarios(id: string): Promise<DestinatariosVereda[]> {
  const { data } = await api.get<DestinatariosVereda[]>(`${ruta(id)}/destinatarios`)
  return data
}

export async function guardarBorradorMensaje(id: string, b: BorradorMensaje): Promise<Alerta> {
  const { data } = await api.put<Alerta>(`${ruta(id)}/borrador`, b)
  return data
}

/** Envía el mensaje por WhatsApp; la alerta pasa a Comunicada. */
export async function comunicarAlerta(id: string, b: BorradorMensaje): Promise<Alerta> {
  const { data } = await api.post<Alerta>(`${ruta(id)}/comunicar`, b)
  return data
}

/**
 * Solo líder y una sola vez (D-17): envía la corrección (plantilla fija + explicación) a los
 * mismos productores que recibieron la alerta. La alerta pasa a Corregida; un segundo intento → 409.
 */
export async function corregirAlerta(id: string, mensaje: string): Promise<Alerta> {
  const { data } = await api.post<Alerta>(`${ruta(id)}/corregir`, { mensaje })
  return data
}

/** Parámetros por categoría. La UI se arma con esta lista: no hay categorías fijas. */
export async function listarParametros(): Promise<ParametroCategoria[]> {
  const { data } = await api.get<ParametroCategoria[]>('/alertas/parametros')
  return data
}

/** Solo líder. Aplica a las alertas que se generen desde ahora. */
export async function guardarParametros(
  categoria: string,
  valores: ParametrosAlerta,
): Promise<ParametroCategoria> {
  const { data } = await api.put<ParametroCategoria>(
    `/alertas/parametros/${encodeURIComponent(categoria)}`,
    valores,
  )
  return data
}
