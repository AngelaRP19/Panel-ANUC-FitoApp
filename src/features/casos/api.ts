// Llamadas HTTP del feature "casos" (RQF20-24). Único lugar del feature que usa `api`.
// Endpoints: GET /casos · GET /casos/conteos · GET /casos/filtros · PATCH /casos/{id}/asignacion
//            GET /tecnicos?activo=true&con_carga=true
//            GET /casos/{id} · /evidencias · /cuestionario · /historial · /explicacion
//            POST /casos/{id}/diagnostico · POST /casos/{id}/cierre
import { api } from '@/services/apiClient'
import type {
  CasoDetalle,
  CasoResumen,
  Cuestionario,
  DatosDiagnostico,
  EventoHistorial,
  Evidencia,
  Explicacion,
  ConteosCasos,
  FiltrosCasos,
  OpcionesFiltroCasos,
  Pagina,
  TecnicoAsignable,
} from './types'

export const TAMANO_PAGINA_CASOS = 15

/** Traduce los filtros de la URL a los parámetros del backend (sin vacíos). */
function parametros(f: Partial<FiltrosCasos>, incluirEstado = true) {
  const p: Record<string, string | number> = {}
  if (incluirEstado && f.estado && f.estado !== 'todos') p.estado = f.estado
  if (f.q) p.q = f.q
  if (f.vereda) p.vereda = f.vereda
  if (f.finca) p.finca_id = f.finca
  if (f.cultivo) p.cultivo_id = f.cultivo
  if (f.especie) p.especie = f.especie
  if (f.categoria) p.categoria = f.categoria
  if (f.tecnico) p.tecnico_id = f.tecnico
  if (f.coincidencia) p.coincidencia_min = Number(f.coincidencia)
  if (f.vencimiento) p.vencimiento = f.vencimiento
  if (f.desde) p.desde = f.desde
  if (f.hasta) p.hasta = f.hasta
  return p
}

/** Bandeja paginada, ordenada por fecha de envío al panel (más recientes primero). */
export async function listarCasos(f: FiltrosCasos): Promise<Pagina<CasoResumen>> {
  const { data } = await api.get<Pagina<CasoResumen>>('/casos', {
    params: { ...parametros(f), page: Number(f.page) || 1, page_size: TAMANO_PAGINA_CASOS },
  })
  return data
}

/** Conteo por estado con los mismos filtros (sin el de estado), para las pestañas. */
export async function contarCasos(f: FiltrosCasos): Promise<ConteosCasos> {
  const { data } = await api.get<ConteosCasos>('/casos/conteos', { params: parametros(f, false) })
  return data
}

export async function obtenerOpcionesFiltro(): Promise<OpcionesFiltroCasos> {
  const { data } = await api.get<OpcionesFiltroCasos>('/casos/filtros')
  return data
}

export async function listarTecnicosAsignables(): Promise<TecnicoAsignable[]> {
  const { data } = await api.get<TecnicoAsignable[]>('/tecnicos', {
    params: { activo: true, con_carga: true },
  })
  return data
}

/** Asigna o reasigna el técnico. Un caso Pendiente de revisión pasa a En revisión. */
export async function asignarTecnico(idCaso: string, tecnicoId: string): Promise<CasoResumen> {
  const { data } = await api.patch<CasoResumen>(`/casos/${encodeURIComponent(idCaso)}/asignacion`, {
    tecnico_id: tecnicoId,
  })
  return data
}

const ruta = (id: string, parte = '') => `/casos/${encodeURIComponent(id)}${parte}`

/** Detalle consolidado. Un caso de otro técnico responde 404 (el interceptor lleva a /sin-acceso). */
export async function obtenerCaso(id: string): Promise<CasoDetalle> {
  const { data } = await api.get<CasoDetalle>(ruta(id))
  return data
}

/** Evidencias con URLs prefirmadas (vencen: se piden de nuevo si una imagen falla). */
export async function obtenerEvidencias(id: string): Promise<Evidencia[]> {
  const { data } = await api.get<Evidencia[]>(ruta(id, '/evidencias'))
  return data
}

export async function obtenerCuestionario(id: string): Promise<Cuestionario> {
  const { data } = await api.get<Cuestionario>(ruta(id, '/cuestionario'))
  return data
}

export async function obtenerHistorial(id: string): Promise<EventoHistorial[]> {
  const { data } = await api.get<EventoHistorial[]>(ruta(id, '/historial'))
  return data
}

export async function obtenerExplicacion(id: string): Promise<Explicacion> {
  const { data } = await api.get<Explicacion>(ruta(id, '/explicacion'))
  return data
}

/** Guarda el diagnóstico técnico: el caso pasa a Registrado (se puede volver a guardar). */
export async function registrarDiagnostico(
  id: string,
  datos: DatosDiagnostico,
): Promise<CasoDetalle> {
  const { data } = await api.post<CasoDetalle>(ruta(id, '/diagnostico'), datos)
  return data
}

/** Cierra el caso: pasa a Cerrado y fija el vencimiento de conservación en 6 meses. */
export async function cerrarCaso(id: string): Promise<CasoDetalle> {
  const { data } = await api.post<CasoDetalle>(ruta(id, '/cierre'))
  return data
}
