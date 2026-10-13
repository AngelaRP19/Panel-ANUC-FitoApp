import { HttpResponse } from 'msw'
import { usuarioDelToken } from '../authSimulado'

/** Prefijo de la API simulada (igual que VITE_API_URL por defecto). */
export const API = '/api/v1'

/** Usuario de la sesión según el encabezado Authorization (token del simulador). */
export function usuarioActual(request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  return usuarioDelToken(token)
}

/** Error con el formato único del backend: { error: { codigo, mensaje, campos } }. */
export function errorApi(
  status: number,
  codigo: string,
  mensaje: string,
  campos: Record<string, string> = {},
) {
  return HttpResponse.json({ error: { codigo, mensaje, campos } }, { status })
}

export const noAutenticado = () => errorApi(401, 'NO_AUTENTICADO', 'La sesión no es válida')
