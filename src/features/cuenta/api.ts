// Llamadas HTTP del feature "cuenta" (RQF04). Único lugar del feature que usa `api`.
// Endpoints: PATCH /me · GET/PUT /me/notificaciones. La contraseña se cambia con el
// proveedor de identidad (services/auth · Cognito `updatePassword`).
import type { UsuarioSesion } from '@/context/AuthContext'
import { api } from '@/services/apiClient'
import { cambiarContrasena as cambiarEnProveedor } from '@/services/auth'
import type { DatosMiCuenta, PreferenciaAviso } from './types'

export async function actualizarMisDatos(datos: DatosMiCuenta): Promise<UsuarioSesion> {
  const { data } = await api.patch<UsuarioSesion>('/me', datos)
  return data
}

export async function cambiarContrasena(actual: string, nueva: string): Promise<void> {
  await cambiarEnProveedor(actual, nueva)
}

export async function obtenerNotificaciones(): Promise<PreferenciaAviso[]> {
  const { data } = await api.get<PreferenciaAviso[]>('/me/notificaciones')
  return data
}

export async function guardarNotificaciones(
  avisos: PreferenciaAviso[],
): Promise<PreferenciaAviso[]> {
  const { data } = await api.put<PreferenciaAviso[]>('/me/notificaciones', avisos)
  return data
}
