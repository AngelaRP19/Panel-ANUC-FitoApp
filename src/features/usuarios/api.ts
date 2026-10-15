// Llamadas HTTP del feature "usuarios" (RQF01, 03, 05, 11-13). Único lugar del feature que usa `api`.
// Endpoints: GET /tecnicos · GET /tecnicos/{id} · POST /tecnicos · PATCH /tecnicos/{id}
//            PATCH /tecnicos/{id}/estado (409 UNICA_CUENTA_ACTIVA)
import type { Pagina } from '@/features/casos'
import { api } from '@/services/apiClient'
import type { Cuenta, DatosCuenta, FiltrosCuentas } from './types'

export async function listarCuentas(f: FiltrosCuentas): Promise<Pagina<Cuenta>> {
  const params: Record<string, string | number> = { page: Number(f.page) || 1, page_size: 10 }
  if (f.q) params.q = f.q
  if (f.rol) params.rol = f.rol
  if (f.estado) params.estado = f.estado
  if (f.carga) params.carga = f.carga
  const { data } = await api.get<Pagina<Cuenta>>('/tecnicos', { params })
  return data
}

export async function obtenerCuenta(id: string): Promise<Cuenta> {
  const { data } = await api.get<Cuenta>(`/tecnicos/${encodeURIComponent(id)}`)
  return data
}

/** Registra la cuenta; la persona recibe una contraseña temporal en su correo. */
export async function registrarCuenta(datos: DatosCuenta): Promise<Cuenta> {
  const { data } = await api.post<Cuenta>('/tecnicos', datos)
  return data
}

export async function editarCuenta(id: string, datos: DatosCuenta): Promise<Cuenta> {
  const { data } = await api.patch<Cuenta>(`/tecnicos/${encodeURIComponent(id)}`, datos)
  return data
}

/** Activa o desactiva. 409 `UNICA_CUENTA_ACTIVA` si es la única cuenta activa de su rol. */
export async function cambiarEstadoCuenta(id: string, activo: boolean): Promise<Cuenta> {
  const { data } = await api.patch<Cuenta>(`/tecnicos/${encodeURIComponent(id)}/estado`, {
    activo,
  })
  return data
}
