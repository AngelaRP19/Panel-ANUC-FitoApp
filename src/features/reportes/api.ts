// Llamadas HTTP del feature "reportes" (pantallas 23 y 24 · solo líder).
// Endpoints: GET /reportes/resumen · GET /reportes/{tipo} · GET/POST /reportes/consultas ·
//            DELETE /reportes/consultas/{id}
// Todos reciben los filtros como parámetros de consulta (listas separadas por coma).
// El CSV y el PDF se arman en el navegador con estos mismos datos (ver exportar.ts).
import { api } from '@/services/apiClient'
import type {
  ConsultaGuardada,
  DatosConsulta,
  FiltrosReporte,
  ReporteDatos,
  ResumenReportes,
  TipoReporte,
} from './types'

/** Solo los filtros con valor viajan a la API. */
const params = (f: FiltrosReporte) => Object.fromEntries(Object.entries(f).filter(([, v]) => v))

export async function obtenerResumen(f: FiltrosReporte): Promise<ResumenReportes> {
  const { data } = await api.get<ResumenReportes>('/reportes/resumen', { params: params(f) })
  return data
}

export async function obtenerReporte(tipo: TipoReporte, f: FiltrosReporte): Promise<ReporteDatos> {
  const { data } = await api.get<ReporteDatos>(`/reportes/${tipo}`, { params: params(f) })
  return data
}

export async function listarConsultas(): Promise<ConsultaGuardada[]> {
  const { data } = await api.get<ConsultaGuardada[]>('/reportes/consultas')
  return data
}

export async function guardarConsulta(d: DatosConsulta): Promise<ConsultaGuardada> {
  const { data } = await api.post<ConsultaGuardada>('/reportes/consultas', d)
  return data
}

export async function eliminarConsulta(id: string): Promise<void> {
  await api.delete(`/reportes/consultas/${encodeURIComponent(id)}`)
}
