// Punto de entrada de la autenticación. El resto del código usa estas funciones y nunca
// importa Amplify. Con VITE_USE_MOCKS=true se usa el simulador en memoria.
import { env } from '@/config/env'
import type { AdaptadorAuth } from './tipos'

export * from './tipos'

let adaptador: Promise<AdaptadorAuth> | null = null

function obtenerAdaptador(): Promise<AdaptadorAuth> {
  adaptador ??= env.usarMocks
    ? import('@/mocks/authSimulado').then((m) => m.adaptadorSimulado)
    : import('./cognito').then((m) => m.adaptadorCognito)
  return adaptador
}

export const iniciarSesion: AdaptadorAuth['iniciarSesion'] = async (correo, contrasena) =>
  (await obtenerAdaptador()).iniciarSesion(correo, contrasena)

export const confirmarNuevaContrasena: AdaptadorAuth['confirmarNuevaContrasena'] = async (nueva) =>
  (await obtenerAdaptador()).confirmarNuevaContrasena(nueva)

export const cerrarSesion: AdaptadorAuth['cerrarSesion'] = async () =>
  (await obtenerAdaptador()).cerrarSesion()

export const obtenerToken: AdaptadorAuth['obtenerToken'] = async () =>
  (await obtenerAdaptador()).obtenerToken()

export const solicitarCodigo: AdaptadorAuth['solicitarCodigo'] = async (correo) =>
  (await obtenerAdaptador()).solicitarCodigo(correo)

export const confirmarRecuperacion: AdaptadorAuth['confirmarRecuperacion'] = async (
  correo,
  codigo,
  nueva,
) => (await obtenerAdaptador()).confirmarRecuperacion(correo, codigo, nueva)
