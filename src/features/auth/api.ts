// Llamadas HTTP del feature "auth" (RQF01-02). Único lugar que usa `api`.
// Endpoints: GET /auth/estado · POST /auth/primer-lider · POST /auth/login · /auth/refresh · /auth/logout · GET /auth/me
// TODO: reemplazar los tipos locales por los de '@/types/api' cuando exista el OpenAPI.
import type { UsuarioSesion } from '@/context/AuthContext'
import { tokenStore } from '@/context/tokenStore'
import { api } from '@/services/apiClient'
import type { LoginValues } from './schemas'

interface TokenResponse {
  access_token: string
}

/** Inicia sesión y devuelve el usuario y su access token. El refresh token llega en cookie. */
export async function login(
  values: LoginValues,
): Promise<{ usuario: UsuarioSesion; token: string }> {
  const { data } = await api.post<TokenResponse>('/auth/login', values)
  tokenStore.set(data.access_token)
  const { data: usuario } = await api.get<UsuarioSesion>('/auth/me')
  return { usuario, token: data.access_token }
}
