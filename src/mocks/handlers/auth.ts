import { http, HttpResponse } from 'msw'
import { aUsuarioMe, usuarios } from '../fixtures/usuarios'
import { API, noAutenticado, usuarioActual } from './comun'

export const authHandlers = [
  // ¿Existe ya un líder técnico? Si no, el login lleva a /primer-uso (RQF01).
  http.get(`${API}/auth/estado`, () =>
    HttpResponse.json({ hay_lider: usuarios.some((u) => u.rol === 'LIDER_TECNICO') }),
  ),

  // Usuario de la sesión: define el rol en el panel.
  http.get(`${API}/me`, ({ request }) => {
    const u = usuarioActual(request)
    return u ? HttpResponse.json(aUsuarioMe(u)) : noAutenticado()
  }),
]
